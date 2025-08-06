module.exports = {
  apps : [{
    name: 'csucc-cashier-queue-backend',
    script: 'npm',
    args: 'run start:prod',
    cwd: '/mnt/d/csucc-queue-mongodb-updated/csucc-cashier-queue-backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost:27017/csucc_queue'
    }
  }]
};
