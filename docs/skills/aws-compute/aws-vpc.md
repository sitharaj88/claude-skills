# AWS VPC

Generate VPC architectures with subnets, NAT gateways, route tables, security groups, NACLs, and VPC endpoints.

## Usage

```bash
/aws-vpc <description of your network architecture>
```

## What It Does

1. Designs a VPC CIDR layout with public, private, and isolated subnets across AZs
2. Generates route tables with appropriate routing for each subnet tier
3. Configures NAT gateways (single or HA) for private subnet internet access
4. Creates security groups with least-privilege ingress and egress rules
5. Sets up VPC endpoints (Gateway and Interface) for AWS service access
6. Produces NACLs, VPC flow logs, and network architecture documentation

## Examples

```bash
/aws-vpc Create a 3-tier VPC with public, private, and isolated subnets across 3 AZs

/aws-vpc Set up a VPC with VPN gateway and Transit Gateway attachment

/aws-vpc Design a VPC with endpoints for S3, DynamoDB, and ECR to avoid NAT costs
```

## Allowed Tools

- `Read` - Read existing network configurations
- `Write` - Create VPC templates and security group configs
- `Edit` - Modify existing networking resources
- `Bash` - Run AWS CLI commands for VPC inspection
- `Glob` - Search for networking-related templates
- `Grep` - Find CIDR and security group references
