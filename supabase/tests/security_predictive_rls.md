# Security regression checklist — HSI Predictive / AI Outputs

These checks must pass before merging `security-hardening` to `main`:

1. Unauthenticated callers cannot read `hsi_predictive_predictions`.
2. An authenticated instructor can read predictions only when the subject is owned/linked to that instructor.
3. An authenticated instructor cannot read another instructor's predictions by changing `subject_id`.
4. An authenticated instructor cannot insert a prediction for another instructor's subject.
5. An active admin can read and insert authorized administrative records.
6. `ai_intelligence_outputs` is readable only by its owner, an owner-linked student/lesson/RPA record, or an active admin.
7. Direct browser writes that impersonate another `user_id` are rejected by RLS.
8. `hsi-predictive-engine` accepts JWT-authenticated calls, but persistence is rejected when the subject is not owned/linked to the caller.
9. `persist:false` remains available for non-persistent calculations.
10. GET/POST behavior and existing HSI-PREDICT v1.1 calculation outputs remain unchanged except for authorization on persistence.
