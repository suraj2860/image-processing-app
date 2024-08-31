module.exports = {
    apps: [
      {
        name: 'redis',
        script: 'docker',
        args: 'run -d --name redis -p 6379:6379 redis',
        interpreter: 'none',
        watch: false,
        autorestart: true,
      },
    ],
  };
  