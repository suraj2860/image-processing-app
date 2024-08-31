module.exports = {
    apps: [
      {
        name: 'redis',
        script: 'sudo docker',
        args: 'run --name redis -d -p 6379:6379 redis',
        interpreter: 'none',
        watch: false,
        autorestart: true,
      },
    ],
  };
  