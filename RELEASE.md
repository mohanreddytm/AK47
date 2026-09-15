# EatHub workspace 2.0 source pair

This release is assembled from the following tested source commits. The parent repository's submodule entries pin these exact revisions.

| Component | Repository | Commit |
|---|---|---|
| Frontend | mohanreddytm/eathubfrontone | 1359bc53841ee37d4effa30c94d2d62b076268cb |
| Backend | mohanreddytm/eathubbackend | 3751d12551b0efcf7273119f632e4892d37979c5 |

Validation: 19 backend tests, 7 frontend tests, successful production build, and the browser acceptance flow through restaurant admin, waiter, kitchen, customer and platform administration. See the frontend `docs/VALIDATION.md` for coverage and screenshots.

Deployment requires the database migration and the matching frontend/backend. This source pair was validated with disposable fixtures; the owner's Neon data and external services have not been modified. Follow README.md and backend OPERATIONS.md for configuration and rollout.
