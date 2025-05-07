{
  "apps": [
    {
      "name": "cryptocurrency-tracker-server",
      "script": "./build/index.js",
      "instances": "max",
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 80,
        "DATABASE_URL": "",
        "CMC_API_KEY": ""
      },
      "env_production": {
        "NODE_ENV": "production"
      }
    }
  ]
}