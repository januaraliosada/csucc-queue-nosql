module.exports = {
  apps : [{
    name: 'csucc-cashier-queue-frontend',
    script: 'pnpm',
    args: 'run preview',
    cwd: '/mnt/d/csucc-queue-mongodb-updated/csucc-cashier-queue',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
