---
name: gcp-vpc
description: Generate VPC networks, subnets, firewall rules, and connectivity configs for Google Cloud networking. Use when the user wants to design or set up GCP networking infrastructure.
argument-hint: "[CIDR] [region] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a Google Cloud VPC and networking expert. Generate production-ready network architectures.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **CIDR range**: Primary subnet ranges (e.g., 10.0.0.0/20)
- **Region(s)**: Which GCP regions to deploy in
- **Tier model**: Public-facing, private with NAT, fully isolated
- **Connectivity**: Internet, VPC peering, Shared VPC, VPN, Cloud Interconnect
- **Services**: What workloads will run (GKE, GCE, Cloud Run, Cloud SQL)

### Step 2: Generate VPC network

**Custom-mode VPC (always recommended over auto-mode):**
```bash
# Create custom VPC (no auto-created subnets)
gcloud compute networks create my-vpc \
  --project=$PROJECT_ID \
  --subnet-mode=custom \
  --bgp-routing-mode=regional \
  --mtu=1460
```

**Standard network layout:**
```
VPC: my-vpc (custom mode)
├── us-central1
│   ├── public-subnet:   10.0.0.0/24   (load balancers, bastion)
│   ├── private-subnet:  10.0.10.0/24  (app servers, GKE nodes)
│   ├── data-subnet:     10.0.20.0/24  (databases, caches)
│   └── GKE secondary ranges:
│       ├── pods:        10.4.0.0/14
│       └── services:    10.8.0.0/20
├── us-east1
│   ├── public-subnet:   10.1.0.0/24
│   ├── private-subnet:  10.1.10.0/24
│   └── data-subnet:     10.1.20.0/24
└── Serverless VPC Access connectors (for Cloud Run/Functions)
```

### Step 3: Generate subnets

```bash
# Public subnet (for load balancers, bastion hosts)
gcloud compute networks subnets create public-subnet-us-central1 \
  --network=my-vpc \
  --region=us-central1 \
  --range=10.0.0.0/24 \
  --enable-flow-logs \
  --logging-aggregation-interval=interval-5-sec \
  --logging-flow-sampling=0.5 \
  --logging-metadata=include-all

# Private subnet (for app servers, GKE)
gcloud compute networks subnets create private-subnet-us-central1 \
  --network=my-vpc \
  --region=us-central1 \
  --range=10.0.10.0/24 \
  --secondary-range=pods=10.4.0.0/14,services=10.8.0.0/20 \
  --enable-private-ip-google-access \
  --enable-flow-logs \
  --logging-aggregation-interval=interval-5-sec \
  --logging-flow-sampling=0.5

# Data subnet (for databases, fully isolated)
gcloud compute networks subnets create data-subnet-us-central1 \
  --network=my-vpc \
  --region=us-central1 \
  --range=10.0.20.0/24 \
  --enable-private-ip-google-access \
  --enable-flow-logs \
  --purpose=PRIVATE
```

### Step 4: Firewall rules

**Firewall rules with tags and service accounts:**
```bash
# Allow health checks from Google Load Balancer ranges
gcloud compute firewall-rules create allow-health-checks \
  --network=my-vpc \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:8080,tcp:443 \
  --source-ranges=35.191.0.0/16,130.211.0.0/22 \
  --target-tags=http-server \
  --priority=1000 \
  --description="Allow Google health check probes"

# Allow IAP for SSH (replaces bastion hosts)
gcloud compute firewall-rules create allow-iap-ssh \
  --network=my-vpc \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:22 \
  --source-ranges=35.235.240.0/20 \
  --target-tags=allow-iap \
  --priority=1000 \
  --description="Allow SSH via IAP tunnel"

# Allow internal communication within VPC
gcloud compute firewall-rules create allow-internal \
  --network=my-vpc \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:0-65535,udp:0-65535,icmp \
  --source-ranges=10.0.0.0/8 \
  --priority=1000 \
  --description="Allow internal VPC communication"

# Allow app tier to database tier (service account based)
gcloud compute firewall-rules create allow-app-to-db \
  --network=my-vpc \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:5432,tcp:3306 \
  --source-service-accounts=app-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --target-service-accounts=db-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --priority=900 \
  --description="Allow app servers to access databases"

# Deny all other ingress (explicit deny-all as safety net)
gcloud compute firewall-rules create deny-all-ingress \
  --network=my-vpc \
  --direction=INGRESS \
  --action=DENY \
  --rules=all \
  --source-ranges=0.0.0.0/0 \
  --priority=65534 \
  --description="Default deny all ingress"

# Deny all egress except essential services
gcloud compute firewall-rules create deny-all-egress \
  --network=my-vpc \
  --direction=EGRESS \
  --action=DENY \
  --rules=all \
  --destination-ranges=0.0.0.0/0 \
  --priority=65534 \
  --description="Default deny all egress"

# Allow egress to Google APIs
gcloud compute firewall-rules create allow-google-apis \
  --network=my-vpc \
  --direction=EGRESS \
  --action=ALLOW \
  --rules=tcp:443 \
  --destination-ranges=199.36.153.8/30 \
  --priority=1000 \
  --description="Allow access to Google APIs via Private Google Access"
```

**Hierarchical firewall policies (for organization-level rules):**
```bash
# Create organization-level firewall policy
gcloud compute firewall-policies create \
  --organization=$ORG_ID \
  --short-name=org-security-policy \
  --description="Organization security baseline"

# Add rule to block known bad IP ranges
gcloud compute firewall-policies rules create 100 \
  --firewall-policy=org-security-policy \
  --organization=$ORG_ID \
  --direction=INGRESS \
  --action=deny \
  --src-ip-ranges=198.51.100.0/24 \
  --layer4-configs=all

# Associate policy with organization
gcloud compute firewall-policies associations create \
  --firewall-policy=org-security-policy \
  --organization=$ORG_ID
```

### Step 5: Cloud NAT

```bash
# Create Cloud Router
gcloud compute routers create my-router \
  --network=my-vpc \
  --region=us-central1

# Create Cloud NAT for private subnets
gcloud compute routers nats create my-nat \
  --router=my-router \
  --region=us-central1 \
  --nat-custom-subnet-ip-ranges=private-subnet-us-central1,data-subnet-us-central1 \
  --auto-allocate-nat-external-ips \
  --min-ports-per-vm=64 \
  --max-ports-per-vm=4096 \
  --enable-dynamic-port-allocation \
  --enable-logging \
  --log-filter=ERRORS_ONLY \
  --tcp-established-idle-timeout=1200 \
  --tcp-transitory-idle-timeout=30
```

### Step 6: VPC peering

```bash
# Create VPC peering from vpc-a to vpc-b
gcloud compute networks peerings create peer-a-to-b \
  --network=vpc-a \
  --peer-network=vpc-b \
  --export-custom-routes \
  --import-custom-routes \
  --export-subnet-routes-with-public-ip \
  --stack-type=IPV4_ONLY

# Create reverse peering (must be bidirectional)
gcloud compute networks peerings create peer-b-to-a \
  --network=vpc-b \
  --peer-network=vpc-a \
  --export-custom-routes \
  --import-custom-routes \
  --export-subnet-routes-with-public-ip \
  --stack-type=IPV4_ONLY
```

### Step 7: Shared VPC

```bash
# Enable Shared VPC in host project
gcloud compute shared-vpc enable $HOST_PROJECT_ID

# Attach service project
gcloud compute shared-vpc associated-projects add $SERVICE_PROJECT_ID \
  --host-project=$HOST_PROJECT_ID

# Grant subnet-level access to service project
gcloud projects add-iam-policy-binding $HOST_PROJECT_ID \
  --member="serviceAccount:$SERVICE_PROJECT_NUMBER@cloudservices.gserviceaccount.com" \
  --role="roles/compute.networkUser" \
  --condition="expression=resource.name.endsWith('private-subnet-us-central1'),title=subnet-access"
```

### Step 8: Private Service Connect and Private Google Access

**Private Google Access (access Google APIs without public IP):**
```bash
# Enable Private Google Access on subnet
gcloud compute networks subnets update private-subnet-us-central1 \
  --region=us-central1 \
  --enable-private-ip-google-access

# Create DNS zone for restricted Google APIs
gcloud dns managed-zones create google-apis \
  --dns-name=googleapis.com. \
  --visibility=private \
  --networks=my-vpc \
  --description="Private Google APIs access"

# Add DNS records for restricted.googleapis.com
gcloud dns record-sets create restricted.googleapis.com. \
  --zone=google-apis \
  --type=A \
  --ttl=300 \
  --rrdatas="199.36.153.4,199.36.153.5,199.36.153.6,199.36.153.7"

gcloud dns record-sets create "*.googleapis.com." \
  --zone=google-apis \
  --type=CNAME \
  --ttl=300 \
  --rrdatas="restricted.googleapis.com."
```

**Private Service Connect (for Google APIs and services):**
```bash
# Create PSC endpoint for Google APIs
gcloud compute addresses create google-apis-psc \
  --global \
  --purpose=PRIVATE_SERVICE_CONNECT \
  --addresses=10.0.30.1 \
  --network=my-vpc

gcloud compute forwarding-rules create google-apis-psc-fr \
  --global \
  --network=my-vpc \
  --address=google-apis-psc \
  --target-google-apis-bundle=all-apis
```

### Step 9: Cloud VPN

**HA VPN (recommended over Classic VPN):**
```bash
# Create HA VPN gateway
gcloud compute vpn-gateways create my-vpn-gw \
  --network=my-vpc \
  --region=us-central1

# Create external VPN gateway (peer)
gcloud compute external-vpn-gateways create peer-vpn-gw \
  --interfaces=0=203.0.113.1,1=203.0.113.2

# Create Cloud Router with ASN
gcloud compute routers create vpn-router \
  --network=my-vpc \
  --region=us-central1 \
  --asn=65001

# Create VPN tunnels (two for HA)
gcloud compute vpn-tunnels create tunnel-0 \
  --vpn-gateway=my-vpn-gw \
  --vpn-gateway-region=us-central1 \
  --peer-external-gateway=peer-vpn-gw \
  --peer-external-gateway-interface=0 \
  --shared-secret="$(openssl rand -base64 24)" \
  --router=vpn-router \
  --region=us-central1 \
  --ike-version=2 \
  --interface=0

gcloud compute vpn-tunnels create tunnel-1 \
  --vpn-gateway=my-vpn-gw \
  --vpn-gateway-region=us-central1 \
  --peer-external-gateway=peer-vpn-gw \
  --peer-external-gateway-interface=1 \
  --shared-secret="$(openssl rand -base64 24)" \
  --router=vpn-router \
  --region=us-central1 \
  --ike-version=2 \
  --interface=1

# Configure BGP sessions
gcloud compute routers add-interface vpn-router \
  --interface-name=tunnel-0-iface \
  --vpn-tunnel=tunnel-0 \
  --ip-address=169.254.0.1 \
  --mask-length=30 \
  --region=us-central1

gcloud compute routers add-bgp-peer vpn-router \
  --peer-name=peer-0 \
  --interface=tunnel-0-iface \
  --peer-ip-address=169.254.0.2 \
  --peer-asn=65002 \
  --region=us-central1
```

### Step 10: Serverless VPC Access

```bash
# Create VPC connector for Cloud Run / Cloud Functions
gcloud compute networks vpc-access connectors create my-connector \
  --region=us-central1 \
  --network=my-vpc \
  --range=10.0.30.0/28 \
  --min-instances=2 \
  --max-instances=10 \
  --machine-type=e2-micro
```

### Step 11: Terraform configuration

```hcl
resource "google_compute_network" "vpc" {
  name                    = "my-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  mtu                     = 1460
}

resource "google_compute_subnetwork" "public" {
  name          = "public-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = "us-central1"
  network       = google_compute_network.vpc.id

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_subnetwork" "private" {
  name                     = "private-subnet"
  ip_cidr_range            = "10.0.10.0/24"
  region                   = "us-central1"
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.4.0.0/14"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.8.0.0/20"
  }

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_subnetwork" "data" {
  name                     = "data-subnet"
  ip_cidr_range            = "10.0.20.0/24"
  region                   = "us-central1"
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_router" "router" {
  name    = "my-router"
  region  = "us-central1"
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "my-nat"
  router                             = google_compute_router.router.name
  region                             = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.private.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  subnetwork {
    name                    = google_compute_subnetwork.data.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  min_ports_per_vm                 = 64
  max_ports_per_vm                 = 4096
  enable_dynamic_port_allocation   = true
  enable_endpoint_independent_mapping = false

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

resource "google_compute_firewall" "allow_health_checks" {
  name    = "allow-health-checks"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["8080", "443"]
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
  target_tags   = ["http-server"]
  priority      = 1000
}

resource "google_compute_firewall" "allow_iap" {
  name    = "allow-iap-ssh"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["allow-iap"]
  priority      = 1000
}

resource "google_compute_firewall" "allow_internal" {
  name    = "allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
  priority      = 1000
}

resource "google_vpc_access_connector" "connector" {
  name          = "my-connector"
  region        = "us-central1"
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.0.30.0/28"
  min_instances = 2
  max_instances = 10
  machine_type  = "e2-micro"
}
```

### Best practices to follow:
- **Always use custom-mode VPCs** (auto-mode creates subnets in all regions with fixed CIDRs)
- **Enable VPC Flow Logs** on all subnets for security auditing and troubleshooting
- **Enable Private Google Access** on all private subnets
- **Use Cloud NAT** instead of assigning public IPs to instances
- **Prefer service account-based firewall rules** over network tags for better security
- **Use IAP tunneling** for SSH/RDP instead of bastion hosts with public IPs
- **Plan CIDR ranges carefully** to avoid overlap with peered VPCs and on-premises networks
- **Use secondary ranges** for GKE pods and services
- **Enable DNS resolution and DNS hostnames** in the VPC
- **Use Shared VPC** for multi-project organizations to centralize networking

### Anti-patterns to avoid:
- Using auto-mode VPCs in production (inflexible CIDR ranges)
- Creating overly permissive firewall rules (e.g., 0.0.0.0/0 on all ports)
- Using the default VPC for production workloads
- Assigning public IPs to backend instances
- Not enabling VPC Flow Logs (required for security auditing)
- Using Classic VPN instead of HA VPN
- Creating excessively large subnets (/8) when smaller ranges suffice
- Not planning for VPC peering CIDR overlap

### Cost optimization:
- **Cloud NAT**: Size appropriately; use dynamic port allocation to reduce IP costs
- **VPC Flow Logs**: Use sampling (0.5) and aggregation intervals to reduce log volume
- **VPC connectors**: Use e2-micro instances and scale based on actual throughput
- **Private Google Access**: Avoid NAT costs for Google API traffic
- **Private Service Connect**: Avoid data processing charges vs. VPC peering
- **Firewall rules**: Use hierarchical policies for organization-wide rules (reduces per-VPC rule count)
- **Shared VPC**: Centralize networking to reduce redundant NAT gateways and VPN tunnels
