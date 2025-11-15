# 1. Deploy a Web Honeypot for 24 Hours & Analyze Attacker Traffic

Description & Idea
Deploy a deliberately simple fake login or web form on the internet and log all incoming requests for at least 24 hours. The goal is to observe real-world automated attacks, scanners, and bot activity, then categorize the traffic and extract patterns.

Acceptance Criteria
- Publicly accessible honeypot endpoint deployed.
- Logging of at least IP, user-agent, timestamp, path, and payload for all requests.
- Minimum of 10 clearly malicious or suspicious requests captured.
- Simple analysis performed: grouping by IP, country (optional), and attack type.
- Short report summarizing attack types (e.g., brute force, SQLi probes, generic scans).

Reason It’s in the List
This anchors everything in reality. You see what the internet actually throws at any exposed service, which changes how you think about risk.

Main Article Points
- Why “nobody will attack my small app” is a myth.
- Types of automated attacks and scanners observed in 24 hours.
- How to interpret logs and what logs miss.
- Why monitoring and telemetry are the foundation of any real security program.

Key Learnings
- Senior Engineers: develop intuition for what production systems face daily.
- Security Engineers: learn to recognize patterns and classify attacks.
- Leaders: realize that any exposed surface is under constant attack.
- AI Era: attacks will increasingly be AI-driven agents; honeypots will reveal these new automated behaviors.

Pragmatic Evaluation
High value. This is simple but gives you a visceral understanding of the threat landscape.

Complexity: Intermediate

Grouping Recommendation
Can stand alone or open the “Real-World Attacks & Platform Security” series.


---


# 2. Build a Secrets-Leak Detector for Git Repos


Description & Idea
Build a CLI tool that scans a repository (or git diff) for leaked secrets using regex patterns and simple heuristics. Focus on API keys, cloud keys, JWTs, and private keys.

Acceptance Criteria
- CLI command to scan a path or git diff.
- Detects at least 5 types of secrets (AWS-style keys, JWT, private keys, generic long tokens, OAuth tokens).
- Human-readable output including file, line, and suspected secret type.
- Exit code 1 if any high-confidence secret is found, 0 if none.
- Simple test repository with known secrets and known safe strings.

Reason It’s in the List
Secrets leaking into source control remains one of the most common and disastrous mistakes, despite all our tools.

Main Article Points
- Real-world incidents caused by secret leaks.
- How simple pattern-based scanning already catches a lot.
- Limitations (false positives, encoded or indirect secrets).
- How to integrate such a tool into CI/CD for real teams.

Key Learnings
- Senior Engineers: gain a practical mindset about “data that must never land in git”.
- Security Engineers: deepen understanding of detection patterns and their limits.
- Leaders: see that culture, guardrails, and tools are all necessary for secret hygiene.
- AI Era: LLMs will generate and sometimes accidentally reveal secrets—secret scanning becomes even more essential.

Pragmatic Evaluation
High value. Practical, directly useful, and still relevant for years.

Complexity: Beginner

Grouping Recommendation
Part of the “Developer Security Tools” mini-series with the SAST CLI and OSV-based dependency scanner.