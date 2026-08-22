# Phase 4 to Phase 5B Policy Audit (Read-Only)

## 1. Complete Phase 4 -> Phase 5B Policy Classification

| Table | Operation | Phase 4 Target Policy | Original Roles | Standalone Anon Exists? | Inline Anon? | Inline Service Role? | Classification |
|---|---|---|---|---|---|---|---|
| ai_history | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| ai_history | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| complaints | INSERT | Tenant Isolation Insert | `{public}` | Yes | Yes | Yes | Mixed public/authenticated (Standalone separation) |
| complaints | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | Yes | Mixed public/authenticated (Standalone separation) |
| election_results | INSERT | Users can insert election results for their tenant | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| election_results | UPDATE | Users can update election results for their tenant | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| event_rsvps | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| event_rsvps | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| events | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| events | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| gallery | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| gallery | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| gb_diary | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| gb_diary | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| housing_societies | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| housing_societies | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| improvements | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| improvements | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| incoming_letters | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| incoming_letters | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| letter_requests | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| letter_requests | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| letter_types | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| letter_types | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| message_logs | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| message_logs | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| non_voters | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| non_voters | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| personal_requests | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| personal_requests | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| sadasya | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| sadasya | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| schemes | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| schemes | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| social_organizations | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| social_organizations | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| staff | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| staff | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| support_tickets | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| support_tickets | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| survey_responses | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| survey_responses | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| surveys | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| surveys | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| tasks | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| tasks | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| visitors | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| visitors | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| voter_applications | INSERT | Tenant Isolation Insert | `{public}` | Yes | Yes | No | Mixed public/authenticated (Standalone separation) |
| voter_applications | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| voters | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| voters | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| ward_provisions | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| ward_provisions | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| work_trackers | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| work_trackers | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| works | INSERT | Tenant Isolation Insert | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |
| works | UPDATE | Tenant Isolation Update | `{public}` | Yes | No | No | Mixed public/authenticated (Standalone separation) |

---
