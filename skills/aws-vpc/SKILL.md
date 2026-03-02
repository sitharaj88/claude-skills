---
name: aws-vpc
description: Generate AWS VPC configurations with subnets, NAT gateways, security groups, NACLs, VPC endpoints, and peering. Use when the user wants to design or set up AWS networking infrastructure.
argument-hint: "[CIDR] [region] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS VPC and networking expert. Generate production-ready network architectures.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **CIDR range**: e.g., 10.0.0.0/16 (ensure no overlap with other VPCs)
- **Region and AZs**: how many availability zones (2-3 for production)
- **Tier model**: public/private/isolated subnets
- **Connectivity**: internet-facing, VPN, Direct Connect, Transit Gateway

### Step 2: Generate VPC and subnets

Design the network layout:

**Standard 3-tier architecture:**
```
VPC: 10.0.0.0/16
├── Public subnets (for ALB, NAT GW, bastion)
│   ├── 10.0.1.0/24  (AZ-a)
│   ├── 10.0.2.0/24  (AZ-b)
│   └── 10.0.3.0/24  (AZ-c)
├── Private subnets (for app servers, ECS, EKS)
│   ├── 10.0.11.0/24 (AZ-a)
│   ├── 10.0.12.0/24 (AZ-b)
│   └── 10.0.13.0/24 (AZ-c)
└── Isolated subnets (for databases, ElastiCache)
    ├── 10.0.21.0/24 (AZ-a)
    ├── 10.0.22.0/24 (AZ-b)
    └── 10.0.23.0/24 (AZ-c)
```

- Internet Gateway for public subnets
- NAT Gateway (per AZ for HA) for private subnets
- No NAT for isolated subnets (database layer)
- Route tables per tier
- Enable DNS hostnames and DNS resolution

### Step 3: Generate security groups

Create security groups with least privilege:
- **ALB SG**: inbound 80/443 from 0.0.0.0/0
- **App SG**: inbound from ALB SG only on app port
- **DB SG**: inbound from App SG only on DB port
- **Bastion SG**: inbound SSH from corporate CIDR only
- All SGs: restrictive egress rules

### Step 4: Generate NACLs

Network ACLs for defense-in-depth:
- Public subnet NACL: allow HTTP/HTTPS, ephemeral ports
- Private subnet NACL: allow from public subnets, deny direct internet
- Isolated subnet NACL: allow from private subnets only

### Step 5: VPC endpoints and connectivity

- **Gateway endpoints**: S3, DynamoDB (free, always add these)
- **Interface endpoints**: ECR, CloudWatch Logs, Secrets Manager, STS, KMS
- VPC peering or Transit Gateway for multi-VPC connectivity
- VPN Gateway or Direct Connect for hybrid connectivity
- VPC Flow Logs to CloudWatch or S3

### Step 6: Output as IaC

Generate the configuration as:
- CloudFormation template
- Terraform module
- CDK construct
(Match whatever IaC the project already uses)

### Best practices:
- Use /16 for VPC, /24 for subnets (room to grow)
- Deploy across minimum 2 AZs (3 for production)
- Use NAT Gateway per AZ for high availability
- Always add S3 and DynamoDB gateway endpoints (free)
- Enable VPC Flow Logs for security auditing
- Use Security Groups as primary control, NACLs as backup
- Tag subnets for EKS/ELB auto-discovery
- Plan CIDR ranges to avoid overlap with peered VPCs
