module.exports = {
  apps: [
    {
      name: "aurify-dashboard-frontend",
      cwd: "/var/www/html/Aurify_Dashboard/frontend",
      script: "npm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};