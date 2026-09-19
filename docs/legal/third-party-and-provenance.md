# Third-Party and Licensing Schedule

This schedule is part of the commercial data room. It distinguishes first-party product modules from dependencies, hosted services, model providers, media, and contributor work. Written rights and terms must be attached before a transfer or enterprise procurement approval.

| Category                             | Current status                                                                                                                 | Required evidence                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| First-party domain modules           | Execution, scoped tools, organization workflows, rules, audit manifests, and migrations are identified in the ownership policy | Contributor and contractor IP assignments                                         |
| npm dependencies                     | Locked, audited, and represented in the generated SBOM                                                                         | License inventory, notices, and source-offer obligations                          |
| Supabase                             | Database, authentication, storage, and RLS integration present                                                                 | Contract, region, data-processing terms, backup/export, and key-handling record   |
| AI gateway and model providers       | Configured through generic OpenAI-compatible environment variables                                                             | Provider terms, data use, retention, model rights, rate limits, and cost schedule |
| Email and webhook providers          | Configurable external delivery integrations                                                                                    | Provider terms, verified domain, data handling, and retry policy                  |
| Fonts, icons, media, and demo assets | Must be inventoried for each release                                                                                           | Source/license records and redistribution permissions                             |
| Contributors and contractors         | Must be verified by the owner                                                                                                  | Signed IP assignment and confidentiality records                                  |
| Evaluation data                      | Repository fixtures are synthetic                                                                                              | Written confirmation that customer data is excluded                               |

The product may use AI as a runtime capability. Product documentation should describe behavior, controls, evaluation evidence, and provider configuration rather than the circumstances of source-code development.
