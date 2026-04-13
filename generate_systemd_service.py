#!/usr/bin/env python3
"""
Generate systemd service file for BuildGuard-AI backend
This avoids all bash heredoc and sed complexity by using pure Python
"""
import os
import sys

def generate_service_file(project_dir, output_path):
    """Generate a valid systemd service file"""
    
    # Ensure paths are correct
    backend_dir = os.path.join(project_dir, "backend")
    venv_bin = os.path.join(project_dir, "venv", "bin")
    gunicorn = os.path.join(venv_bin, "gunicorn")
    env_file = os.path.join(backend_dir, ".env")
    
    service_content = f"""[Unit]
Description=BuildGuard-AI Backend (FastAPI + Gunicorn)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory={backend_dir}
Environment=PATH={venv_bin}
EnvironmentFile=-{env_file}

ExecStart={gunicorn} --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000 --timeout 60 --access-logfile /var/log/buildguard/access.log --error-logfile /var/log/buildguard/error.log main:app

Restart=always
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
"""
    
    # Write the service file
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        f.write(service_content)
    
    print(f"[OK] Service file generated at {output_path}")
    print("\nService file contents:")
    print("=" * 80)
    print(service_content)
    print("=" * 80)
    
    # Verify the file exists
    if os.path.exists(output_path):
        print(f"[OK] File verified to exist: {output_path}")
        return True
    else:
        print(f"[ERROR] Failed to create file: {output_path}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 generate_systemd_service.py <project_dir>")
        sys.exit(1)
    
    project_dir = sys.argv[1]
    output_path = "/etc/systemd/system/buildguard-backend.service"
    
    if not os.path.exists(project_dir):
        print(f"[ERROR] Project directory not found: {project_dir}")
        sys.exit(1)
    
    success = generate_service_file(project_dir, output_path)
    sys.exit(0 if success else 1)
