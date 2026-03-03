---
name: gcp-cloud-dns
description: Generate Cloud DNS zones, records, and DNS policies for domain management. Use when the user wants to configure DNS on Google Cloud.
argument-hint: "[domain] [type]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a GCP Cloud DNS expert. Generate production-ready DNS configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Domain**: domain name to manage
- **Record type**: A, AAAA, CNAME, MX, TXT, SRV, CAA
- **Zone type**: public, private, forwarding, peering
- **Routing policy**: weighted round-robin, geolocation, failover
- **DNSSEC**: whether to enable DNSSEC signing

### Step 2: Generate managed zones

**Public managed zone (Terraform):**
```hcl
resource "google_dns_managed_zone" "public" {
  name        = "example-zone"
  dns_name    = "example.com."
  description = "Public DNS zone for example.com"
  project     = var.project_id

  dnssec_config {
    state         = "on"
    non_existence = "nsec3"
    default_key_specs {
      algorithm  = "rsasha256"
      key_length = 2048
      key_type   = "keySigning"
    }
    default_key_specs {
      algorithm  = "rsasha256"
      key_length = 1024
      key_type   = "zoneSigning"
    }
  }

  cloud_logging_config {
    enable_logging = true
  }

  labels = var.labels
}
```

**Private managed zone:**
```hcl
resource "google_dns_managed_zone" "private" {
  name        = "internal-zone"
  dns_name    = "internal.example.com."
  description = "Private DNS zone for internal services"
  project     = var.project_id
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.vpc.id
    }
    networks {
      network_url = google_compute_network.shared_vpc.id
    }
  }

  labels = var.labels
}
```

**Forwarding zone (on-premises DNS integration):**
```hcl
resource "google_dns_managed_zone" "forwarding" {
  name        = "onprem-forwarding"
  dns_name    = "corp.example.com."
  description = "Forward DNS queries to on-premises DNS servers"
  project     = var.project_id
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.vpc.id
    }
  }

  forwarding_config {
    target_name_servers {
      ipv4_address    = "10.0.1.10"
      forwarding_path = "private"
    }
    target_name_servers {
      ipv4_address    = "10.0.1.11"
      forwarding_path = "private"
    }
  }
}
```

**Peering zone (cross-project DNS):**
```hcl
resource "google_dns_managed_zone" "peering" {
  name        = "peering-zone"
  dns_name    = "services.example.com."
  description = "DNS peering to shared services project"
  project     = var.project_id
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.vpc.id
    }
  }

  peering_config {
    target_network {
      network_url = "projects/shared-services/global/networks/shared-vpc"
    }
  }
}
```

### Step 3: Generate DNS records

**gcloud commands:**
```bash
# A record
gcloud dns record-sets create api.example.com. \
  --zone=example-zone \
  --type=A \
  --ttl=300 \
  --rrdatas="203.0.113.10"

# AAAA record
gcloud dns record-sets create api.example.com. \
  --zone=example-zone \
  --type=AAAA \
  --ttl=300 \
  --rrdatas="2001:db8::1"

# CNAME record
gcloud dns record-sets create www.example.com. \
  --zone=example-zone \
  --type=CNAME \
  --ttl=300 \
  --rrdatas="example.com."

# MX records
gcloud dns record-sets create example.com. \
  --zone=example-zone \
  --type=MX \
  --ttl=3600 \
  --rrdatas="10 mail1.example.com.,20 mail2.example.com."

# TXT record (SPF)
gcloud dns record-sets create example.com. \
  --zone=example-zone \
  --type=TXT \
  --ttl=3600 \
  --rrdatas="\"v=spf1 include:_spf.google.com ~all\""

# TXT record (DKIM)
gcloud dns record-sets create google._domainkey.example.com. \
  --zone=example-zone \
  --type=TXT \
  --ttl=3600 \
  --rrdatas="\"v=DKIM1; k=rsa; p=MIIBIjANBg...\""

# TXT record (DMARC)
gcloud dns record-sets create _dmarc.example.com. \
  --zone=example-zone \
  --type=TXT \
  --ttl=3600 \
  --rrdatas="\"v=DMARC1; p=reject; rua=mailto:dmarc@example.com; pct=100\""

# SRV record
gcloud dns record-sets create _sip._tcp.example.com. \
  --zone=example-zone \
  --type=SRV \
  --ttl=300 \
  --rrdatas="10 60 5060 sip.example.com."

# CAA record
gcloud dns record-sets create example.com. \
  --zone=example-zone \
  --type=CAA \
  --ttl=3600 \
  --rrdatas='0 issue "letsencrypt.org",0 issue "pki.goog",0 iodef "mailto:security@example.com"'
```

**Terraform record sets:**
```hcl
resource "google_dns_record_set" "a_record" {
  name         = "api.example.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas      = ["203.0.113.10"]
}

resource "google_dns_record_set" "cname" {
  name         = "www.example.com."
  type         = "CNAME"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas      = ["example.com."]
}

resource "google_dns_record_set" "mx" {
  name         = "example.com."
  type         = "MX"
  ttl          = 3600
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas = [
    "10 mail1.example.com.",
    "20 mail2.example.com.",
  ]
}

resource "google_dns_record_set" "txt_spf" {
  name         = "example.com."
  type         = "TXT"
  ttl          = 3600
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas      = ["\"v=spf1 include:_spf.google.com ~all\""]
}

resource "google_dns_record_set" "caa" {
  name         = "example.com."
  type         = "CAA"
  ttl          = 3600
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas = [
    "0 issue \"letsencrypt.org\"",
    "0 issue \"pki.goog\"",
    "0 iodef \"mailto:security@example.com\"",
  ]
}
```

### Step 4: Configure routing policies

**Weighted round-robin (traffic splitting):**
```hcl
resource "google_dns_record_set" "weighted" {
  name         = "api.example.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id

  routing_policy {
    wrr {
      weight  = 0.8
      rrdatas = ["203.0.113.10"]
    }
    wrr {
      weight  = 0.2
      rrdatas = ["203.0.113.20"]
    }
  }
}
```

**Geolocation routing:**
```hcl
resource "google_dns_record_set" "geo" {
  name         = "api.example.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id

  routing_policy {
    geo {
      location = "us-east1"
      rrdatas  = ["203.0.113.10"]
    }
    geo {
      location = "europe-west1"
      rrdatas  = ["203.0.113.20"]
    }
    geo {
      location = "asia-east1"
      rrdatas  = ["203.0.113.30"]
    }
  }
}
```

**Failover routing:**
```hcl
resource "google_dns_record_set" "failover" {
  name         = "api.example.com."
  type         = "A"
  ttl          = 60
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id

  routing_policy {
    primary_backup {
      primary {
        internal_load_balancers {
          ip_address  = google_compute_forwarding_rule.primary.ip_address
          ip_protocol = "tcp"
          load_balancer_type = "regionalL4ilb"
          network_url = google_compute_network.vpc.id
          port        = "443"
          project     = var.project_id
          region      = "us-central1"
        }
      }
      backup_geo {
        location = "us-east1"
        rrdatas  = ["203.0.113.20"]
      }
      trickle_ratio = 0.1
    }
  }
}
```

### Step 5: Configure DNSSEC

**Enable DNSSEC:**
```bash
# Enable DNSSEC on existing zone
gcloud dns managed-zones update example-zone \
  --dnssec-state=on

# Get DS records for registrar
gcloud dns dns-keys list --zone=example-zone \
  --filter="type=keySigning" \
  --format="value(ds_record())"

# Transfer DS records to your domain registrar
```

**DNSSEC with Terraform:**
```hcl
resource "google_dns_managed_zone" "dnssec_zone" {
  name     = "secure-zone"
  dns_name = "secure.example.com."
  project  = var.project_id

  dnssec_config {
    state         = "on"
    non_existence = "nsec3"
  }
}

# Output DS records
output "dnssec_ds_records" {
  value = google_dns_managed_zone.dnssec_zone.dnssec_config
}
```

### Step 6: Configure response policies (DNS firewall)

```hcl
resource "google_dns_response_policy" "firewall" {
  response_policy_name = "security-policy"
  project              = var.project_id
  description          = "DNS firewall to block malicious domains"

  networks {
    network_url = google_compute_network.vpc.id
  }
}

# Block a malicious domain
resource "google_dns_response_policy_rule" "block_malware" {
  response_policy = google_dns_response_policy.firewall.response_policy_name
  rule_name       = "block-malware-domain"
  dns_name        = "malware.example.org."
  project         = var.project_id

  local_data {
    local_datas {
      name    = "malware.example.org."
      type    = "A"
      ttl     = 300
      rrdatas = ["0.0.0.0"]
    }
  }
}

# Redirect a domain to an internal service
resource "google_dns_response_policy_rule" "redirect" {
  response_policy = google_dns_response_policy.firewall.response_policy_name
  rule_name       = "redirect-internal"
  dns_name        = "api.thirdparty.com."
  project         = var.project_id

  local_data {
    local_datas {
      name    = "api.thirdparty.com."
      type    = "A"
      ttl     = 300
      rrdatas = ["10.0.1.100"]
    }
  }
}

# Block entire domain with NXDOMAIN behavior
resource "google_dns_response_policy_rule" "block_domain" {
  response_policy = google_dns_response_policy.firewall.response_policy_name
  rule_name       = "block-ads"
  dns_name        = "*.ads.example.net."
  project         = var.project_id

  behavior = "behaviorUnspecified"
}
```

### Step 7: Split-horizon DNS

```hcl
# Public zone - serves external users
resource "google_dns_managed_zone" "public" {
  name     = "public-zone"
  dns_name = "example.com."
  project  = var.project_id
}

resource "google_dns_record_set" "public_api" {
  name         = "api.example.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas      = [google_compute_global_address.external_lb.address]
}

# Private zone - serves internal VPC users
resource "google_dns_managed_zone" "private" {
  name       = "private-zone"
  dns_name   = "example.com."
  project    = var.project_id
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.vpc.id
    }
  }
}

resource "google_dns_record_set" "private_api" {
  name         = "api.example.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.private.name
  project      = var.project_id
  rrdatas      = [google_compute_address.internal_lb.address]
}
```

### Step 8: Integration with Load Balancing

```hcl
# Point domain to Global HTTP(S) Load Balancer
resource "google_dns_record_set" "lb_a" {
  name         = "app.example.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas      = [google_compute_global_address.lb.address]
}

resource "google_dns_record_set" "lb_aaaa" {
  name         = "app.example.com."
  type         = "AAAA"
  ttl          = 300
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas      = [google_compute_global_address.lb.ipv6_address]
}

# SSL certificate with DNS authorization
resource "google_certificate_manager_dns_authorization" "default" {
  name   = "app-dns-auth"
  domain = "app.example.com"
}

resource "google_dns_record_set" "cert_validation" {
  name         = google_certificate_manager_dns_authorization.default.dns_resource_record[0].name
  type         = google_certificate_manager_dns_authorization.default.dns_resource_record[0].type
  ttl          = 300
  managed_zone = google_dns_managed_zone.public.name
  project      = var.project_id
  rrdatas      = [google_certificate_manager_dns_authorization.default.dns_resource_record[0].data]
}
```

### Step 9: Integration with GKE

```yaml
# ExternalDNS for GKE (automatically manages DNS records)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: external-dns
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: external-dns
  template:
    spec:
      serviceAccountName: external-dns
      containers:
        - name: external-dns
          image: registry.k8s.io/external-dns/external-dns:v0.14.0
          args:
            - --source=service
            - --source=ingress
            - --provider=google
            - --google-project=my-project
            - --google-zone-visibility=public
            - --domain-filter=example.com
            - --policy=upsert-only
            - --registry=txt
            - --txt-owner-id=my-gke-cluster
```

### Step 10: Cross-project DNS

```hcl
# In shared services project: create the zone
resource "google_dns_managed_zone" "shared" {
  name       = "shared-services"
  dns_name   = "shared.example.com."
  project    = var.shared_project_id
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = "projects/${var.shared_project_id}/global/networks/shared-vpc"
    }
  }
}

# In consuming project: create peering zone
resource "google_dns_managed_zone" "peer" {
  name       = "shared-services-peer"
  dns_name   = "shared.example.com."
  project    = var.consumer_project_id
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = "projects/${var.consumer_project_id}/global/networks/app-vpc"
    }
  }

  peering_config {
    target_network {
      network_url = "projects/${var.shared_project_id}/global/networks/shared-vpc"
    }
  }
}
```

### Step 11: Domain registration

```bash
# Register a domain
gcloud domains registrations register example.com \
  --contact-data-from-file=contacts.yaml \
  --contact-privacy=private-contact-data \
  --yearly-price="12.00 USD" \
  --cloud-dns-zone=example-zone

# Transfer a domain
gcloud domains registrations configure dns example.com \
  --cloud-dns-zone=example-zone

# Enable auto-renewal
gcloud domains registrations configure management example.com \
  --transfer-lock-state=locked \
  --preferred-renewal-method=automatic-renewal
```

## Best Practices

- Enable DNSSEC for all public zones to prevent DNS spoofing
- Use Cloud DNS logging for troubleshooting and audit trails
- Use CAA records to restrict which certificate authorities can issue certificates
- Set appropriate TTLs: lower (60-300s) for failover, higher (3600s) for stable records
- Use private zones for internal service discovery instead of modifying /etc/hosts
- Use response policies to block known malicious domains
- Implement split-horizon DNS for different resolution behavior inside vs outside VPC
- Use Terraform to manage DNS records as code for auditability

## Anti-Patterns

- Do not set TTLs too low on records that rarely change (increases query volume and cost)
- Do not use CNAME records at the zone apex (use A records instead)
- Do not forget the trailing dot on DNS names in Terraform configurations
- Do not manage DNS records manually in production; use Infrastructure as Code
- Do not skip DMARC/SPF/DKIM records for domains that send email
- Do not use public DNS zones for internal-only services

## Security Considerations

- Enable DNSSEC and register DS records with your domain registrar
- Use CAA records to restrict certificate issuance
- Configure DMARC with `p=reject` to prevent email spoofing
- Use response policies to block DNS resolution of known malicious domains
- Restrict DNS zone admin IAM roles to authorized personnel
- Enable Cloud DNS logging and export logs for security analysis
- Use private zones to prevent internal service names from leaking externally
- Regularly audit DNS records for stale or unauthorized entries

## Cost Optimization

- Cloud DNS charges per managed zone and per million queries
- Consolidate zones where possible to reduce per-zone costs
- Use appropriate TTLs to reduce query volume
- Delete unused managed zones to avoid monthly charges
- Use private zones only for networks that need them (each network attachment adds cost)
- Monitor query volumes with Cloud Monitoring to identify unexpected spikes
