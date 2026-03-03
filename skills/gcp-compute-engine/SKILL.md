---
name: gcp-compute-engine
description: Generate Compute Engine instances, templates, and managed instance groups with autoscaling, networking, and security configs. Use when the user wants to create or manage GCE virtual machines.
argument-hint: "[machine-type] [image] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(terraform *)
user-invocable: true
---

## Instructions

You are a Google Compute Engine expert. Generate production-ready VM instances, instance templates, and managed instance groups.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Machine type**: e2-micro, e2-medium, n2-standard-4, n2d-standard-8, c3-highcpu-8, m3-megamem-128, a2-highgpu-1g
- **Image**: debian-12, ubuntu-2204-lts, ubuntu-2404-lts, rocky-linux-9, cos-stable (Container-Optimized OS), windows-2022
- **Purpose**: Web server, application server, database, batch processing, GPU workload
- **Scale**: Single instance, instance template + MIG, or preemptible/spot for cost savings

### Step 2: Choose machine type family

**General-purpose (most workloads):**
- `e2-*`: Cost-optimized, burst-capable (e2-micro, e2-small, e2-medium, e2-standard-2/4/8)
- `n2-*` / `n2d-*`: Balanced performance, sustained use discounts
- `n4-*`: Latest generation, best price-performance

**Compute-optimized:**
- `c3-*` / `c3d-*`: Highest per-core performance (HPC, gaming, single-threaded)
- `h3-*`: High-performance computing

**Memory-optimized:**
- `m3-*`: Large in-memory databases (SAP HANA, in-memory analytics)

**Accelerator-optimized:**
- `a2-*` / `a3-*`: NVIDIA GPUs (ML training, rendering)
- `g2-*`: NVIDIA L4 GPUs (inference, graphics)

### Step 3: Generate instance configuration

**gcloud CLI - single instance:**
```bash
gcloud compute instances create my-instance \
  --project=$PROJECT_ID \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-balanced \
  --network-interface=network=my-vpc,subnet=my-subnet,no-address \
  --service-account=my-instance-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --scopes=cloud-platform \
  --metadata-from-file=startup-script=startup.sh \
  --tags=http-server,https-server \
  --labels=env=production,team=backend \
  --shielded-secure-boot \
  --shielded-vtpm \
  --shielded-integrity-monitoring
```

**Instance with attached persistent disk:**
```bash
# Create additional data disk
gcloud compute disks create data-disk \
  --zone=us-central1-a \
  --size=200GB \
  --type=pd-ssd

# Create instance with attached disk
gcloud compute instances create my-instance \
  --zone=us-central1-a \
  --machine-type=n2-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-balanced \
  --disk=name=data-disk,device-name=data-disk,mode=rw,auto-delete=no
```

**Instance with GPU:**
```bash
gcloud compute instances create gpu-instance \
  --zone=us-central1-a \
  --machine-type=g2-standard-4 \
  --accelerator=count=1,type=nvidia-l4 \
  --image-family=common-cu123-debian-12 \
  --image-project=deeplearning-platform-release \
  --boot-disk-size=200GB \
  --boot-disk-type=pd-ssd \
  --maintenance-policy=TERMINATE \
  --restart-on-failure
```

### Step 4: Startup scripts

**Linux startup script:**
```bash
#!/bin/bash
set -euo pipefail

# Log startup
echo "Starting instance configuration..." | logger -t startup-script

# Update and install packages
apt-get update -y
apt-get install -y nginx docker.io

# Mount data disk
if [ -e /dev/disk/by-id/google-data-disk ]; then
  mkdir -p /mnt/data
  if ! blkid /dev/disk/by-id/google-data-disk; then
    mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0 /dev/disk/by-id/google-data-disk
  fi
  mount -o discard,defaults /dev/disk/by-id/google-data-disk /mnt/data
  echo '/dev/disk/by-id/google-data-disk /mnt/data ext4 discard,defaults 0 2' >> /etc/fstab
fi

# Fetch config from metadata
APP_ENV=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/attributes/app-env" \
  -H "Metadata-Flavor: Google")

# Fetch secrets from Secret Manager
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password" --project="$PROJECT_ID")

# Configure application
cat > /etc/app/config.yaml <<EOF
environment: ${APP_ENV}
database:
  password: ${DB_PASSWORD}
EOF

# Start services
systemctl enable --now docker
docker pull gcr.io/$PROJECT_ID/my-app:latest
docker run -d --restart=always -p 8080:8080 gcr.io/$PROJECT_ID/my-app:latest

echo "Startup complete" | logger -t startup-script
```

**Container-Optimized OS (COS) metadata:**
```yaml
# Use cloud-init with COS for container workloads
spec:
  containers:
    - name: my-app
      image: gcr.io/my-project/my-app:latest
      ports:
        - containerPort: 8080
          hostPort: 8080
      env:
        - name: NODE_ENV
          value: production
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      hostPath:
        path: /mnt/disks/data
```

### Step 5: Instance templates and managed instance groups

**Instance template:**
```bash
gcloud compute instance-templates create my-template \
  --machine-type=e2-standard-2 \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-balanced \
  --network=my-vpc \
  --subnet=my-subnet \
  --no-address \
  --service-account=mig-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --scopes=cloud-platform \
  --metadata-from-file=startup-script=startup.sh \
  --tags=http-server \
  --labels=env=production \
  --region=us-central1
```

**Managed instance group (MIG) with autoscaling:**
```bash
# Create regional MIG (multi-zone for HA)
gcloud compute instance-groups managed create my-mig \
  --template=my-template \
  --size=2 \
  --region=us-central1 \
  --health-check=my-health-check \
  --initial-delay=300

# Configure autoscaling
gcloud compute instance-groups managed set-autoscaling my-mig \
  --region=us-central1 \
  --min-num-replicas=2 \
  --max-num-replicas=10 \
  --target-cpu-utilization=0.6 \
  --cool-down-period=90 \
  --scale-in-control=max-scaled-in-replicas=2,time-window=300

# Named ports for load balancer
gcloud compute instance-groups managed set-named-ports my-mig \
  --region=us-central1 \
  --named-ports=http:8080
```

**Health check:**
```bash
gcloud compute health-checks create http my-health-check \
  --port=8080 \
  --request-path=/health \
  --check-interval=10s \
  --timeout=5s \
  --healthy-threshold=2 \
  --unhealthy-threshold=3
```

**Rolling update:**
```bash
gcloud compute instance-groups managed rolling-action start-update my-mig \
  --version=template=my-template-v2 \
  --region=us-central1 \
  --max-surge=3 \
  --max-unavailable=0 \
  --min-ready=60
```

### Step 6: Terraform configuration

```hcl
resource "google_compute_instance_template" "app" {
  name_prefix  = "app-template-"
  machine_type = "e2-standard-2"
  region       = "us-central1"

  disk {
    source_image = "debian-cloud/debian-12"
    auto_delete  = true
    boot         = true
    disk_size_gb = 20
    disk_type    = "pd-balanced"
  }

  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.subnet.id
    # No external IP - use Cloud NAT for outbound
  }

  service_account {
    email  = google_service_account.instance_sa.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    startup-script = file("${path.module}/scripts/startup.sh")
    enable-oslogin = "TRUE"
  }

  tags = ["http-server"]

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_region_instance_group_manager" "app" {
  name   = "app-mig"
  region = "us-central1"

  version {
    instance_template = google_compute_instance_template.app.id
  }

  base_instance_name = "app"
  target_size        = null # Managed by autoscaler

  named_port {
    name = "http"
    port = 8080
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.app.id
    initial_delay_sec = 300
  }

  update_policy {
    type                         = "PROACTIVE"
    instance_redistribution_type = "PROACTIVE"
    minimal_action               = "REPLACE"
    most_disruptive_allowed_action = "REPLACE"
    max_surge_fixed              = 3
    max_unavailable_fixed        = 0
    min_ready_sec                = 60
  }
}

resource "google_compute_region_autoscaler" "app" {
  name   = "app-autoscaler"
  region = "us-central1"
  target = google_compute_region_instance_group_manager.app.id

  autoscaling_policy {
    max_replicas    = 10
    min_replicas    = 2
    cooldown_period = 90

    cpu_utilization {
      target = 0.6
    }

    scale_in_control {
      max_scaled_in_replicas {
        fixed = 2
      }
      time_window_sec = 300
    }
  }
}
```

### Step 7: SSH and access management

**OS Login (recommended):**
```bash
# Enable OS Login at project level
gcloud compute project-info add-metadata --metadata enable-oslogin=TRUE

# Grant OS Login roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:developer@example.com" \
  --role="roles/compute.osLogin"

# For sudo access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:admin@example.com" \
  --role="roles/compute.osAdminLogin"

# Connect via IAP tunnel (no public IP needed)
gcloud compute ssh my-instance \
  --zone=us-central1-a \
  --tunnel-through-iap
```

**IAP TCP forwarding for private instances:**
```bash
# Allow IAP tunnel in firewall
gcloud compute firewall-rules create allow-iap-ssh \
  --direction=INGRESS \
  --network=my-vpc \
  --action=ALLOW \
  --rules=tcp:22 \
  --source-ranges=35.235.240.0/20 \
  --target-tags=allow-iap
```

### Step 8: Preemptible and Spot VMs

```bash
# Spot VM (up to 91% discount)
gcloud compute instances create batch-worker \
  --machine-type=e2-standard-8 \
  --provisioning-model=SPOT \
  --instance-termination-action=STOP \
  --maintenance-policy=TERMINATE \
  --image-family=debian-12 \
  --image-project=debian-cloud

# In MIG for batch workloads
gcloud compute instance-templates create spot-template \
  --machine-type=e2-standard-4 \
  --provisioning-model=SPOT \
  --instance-termination-action=DELETE \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

### Step 9: Custom images

```bash
# Create custom image from instance disk
gcloud compute images create my-custom-image \
  --source-disk=my-instance \
  --source-disk-zone=us-central1-a \
  --family=my-app-images \
  --storage-location=us

# Create image from a snapshot
gcloud compute images create my-image-v2 \
  --source-snapshot=my-snapshot \
  --family=my-app-images

# Use image family in templates (auto-selects latest)
gcloud compute instance-templates create my-template \
  --image-family=my-app-images \
  --image-project=$PROJECT_ID
```

### Best practices to follow:
- **Use instance templates** for all production workloads, never standalone instances
- **Use regional MIGs** for high availability across zones
- **Enable OS Login** instead of managing SSH keys in metadata
- **Use IAP tunneling** for SSH to private instances (no public IPs needed)
- **Enable Shielded VM** features (secure boot, vTPM, integrity monitoring)
- **Use `no-address`** on instances that do not need public IPs; use Cloud NAT for outbound
- **Set appropriate scopes** - use `cloud-platform` and control access via IAM roles on service account
- **Tag instances** for firewall rules and resource organization
- **Use image families** for automatic patching in instance templates
- **Configure health checks** for auto-healing in MIGs

### Anti-patterns to avoid:
- Managing individual instances in production (use MIGs)
- Using default service account with broad permissions
- Adding SSH keys via instance metadata (use OS Login)
- Assigning public IPs to backend instances
- Using `f1-micro` for production (too small, use `e2-micro` minimum)
- Not setting metadata `enable-oslogin=TRUE`
- Creating persistent disks without snapshots/backups

### Cost optimization:
- **Committed use discounts (CUDs)**: 1-year (37%) or 3-year (55%) for stable workloads
- **Sustained use discounts**: Automatic discounts for N1/N2 running >25% of month
- **Spot VMs**: Up to 91% discount for fault-tolerant batch workloads
- **Right-size recommendations**: Use Recommender to identify oversized instances
- **E2 shared-core**: Use `e2-micro`/`e2-small` for lightweight workloads
- **Stop idle instances**: Use instance schedules for dev/test environments
- **Custom machine types**: Match exact CPU/memory needs instead of rounding up
- **Preemptible MIGs**: Use for batch processing, CI/CD workers, data processing
