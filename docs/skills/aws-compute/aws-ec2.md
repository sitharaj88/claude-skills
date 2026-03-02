# AWS EC2

Generate EC2 launch templates, Auto Scaling Groups, user data scripts, and security configurations for Linux and Windows instances.

## Usage

```bash
/aws-ec2 <description of your EC2 setup>
```

## What It Does

1. Selects appropriate instance types based on workload requirements
2. Generates launch templates with AMI, networking, and storage configs
3. Creates Auto Scaling Groups with scaling policies and health checks
4. Produces user data scripts for instance bootstrapping
5. Configures security groups with least-privilege ingress/egress rules
6. Sets up IAM instance profiles for AWS service access

## Examples

```bash
/aws-ec2 Create a web server ASG with ALB, scaling from 2-10 instances based on CPU

/aws-ec2 Set up a bastion host in a public subnet with SSH key pair access

/aws-ec2 Launch a Windows Server with IIS and domain join user data script
```

## Allowed Tools

- `Read` - Read existing infrastructure files
- `Write` - Create launch templates, user data scripts, and configs
- `Edit` - Modify existing EC2 configurations
- `Bash` - Run AWS CLI commands for validation
- `Glob` - Search for related templates
- `Grep` - Find existing resource references
