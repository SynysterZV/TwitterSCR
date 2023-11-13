To use this service, you must spin up the Redis instance in the docker-compose.yml file using this command:
```
docker compose up -d
```

Next, you should rename `src/credentials.example.json` to `credentials.json` and add a list of authenticated accounts.

To get the info needed for this service, you have to sign into the accounts on browser and take the values from the cookies from the website