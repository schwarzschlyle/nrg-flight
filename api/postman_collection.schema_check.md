# Postman JSON sanity check (manual)

If you want to validate the collection/environment JSON without running commands:

1. Open Postman.
2. Import `api/postman_environment_local.json`.
3. Import `api/postman_collection.json`.
4. Run folder **“00 - Init”**.
5. Then run the full collection.

If Postman accepts the import and the runner executes, the JSON structure is valid.
