#!/usr/bin/env python3
"""Validate the stable guide contract and current repository-local links."""

import argparse
import pathlib
import re
import sys
import tempfile
import urllib.parse
from dataclasses import dataclass


@dataclass(frozen=True)
class Problem:
    check: str
    detail: str


REQUIRED = {
    "contract:start": ("## Start here", "docs/plans/", "knowledge/index.md"),
    "contract:invariants": (
        "## Invariants",
        "Fail closed",
        "Context owns the sink",
        "Zero upstream rate violations",
        "The wire format does not move",
        "Data is never localized",
        "Identifiers stay frozen",
    ),
    "contract:work": (
        "## Work loop",
        "Plan → Act → Verify",
        "Scope deltas",
        "red → green",
        "independent review",
        "Delegation is a management boundary",
    ),
    "contract:repository": (
        "## Repository operations",
        "isolated worktree",
        "integration branch named by the active plan",
        "work-item PR",
        "Only the final integration PR targets `main`",
    ),
    "contract:memory": (
        "## Memory: Query → Ingest → Lint",
        "Query",
        "Ingest",
        "Lint",
        "knowledge/index.md",
        "knowledge/log.md",
        "knowledge/decisions/okf-query-ingest-lint.md",
        "git log --",
    ),
    "contract:proof-route": (
        "## Verification and review",
        "knowledge/testing/test-strategy.md",
    ),
    "contract:ponytail": (
        "## Ponytail",
        "Does this need to exist?",
        "already in the repository",
        "standard library",
        "native platform",
        "installed dependency",
        "one line",
        "minimum",
    ),
    "contract:authority": (
        "## Authority boundaries",
        "Plans:",
        "Code/tests:",
        "Knowledge:",
        "GitHub:",
        "External systems:",
    ),
}


CASES = {
    "missing-local-link": (
        "local-link", "AGENTS.md", "knowledge/index.md", "knowledge/missing.md"
    ),
    "missing-knowledge-link": (
        "local-link",
        "knowledge/testing/test-strategy.md",
        "../index.md",
        "missing.md",
    ),
    "missing-start": ("contract:start", "AGENTS.md", "## Start here", "## Begin"),
    "missing-invariant": (
        "contract:invariants",
        "AGENTS.md",
        "Context owns the sink",
        "Escape differently",
    ),
    "missing-memory": (
        "contract:memory",
        "AGENTS.md",
        "## Memory: Query → Ingest → Lint",
        "## Memory",
    ),
    "missing-work": (
        "contract:work",
        "AGENTS.md",
        "independent review",
        "self review",
    ),
    "missing-delegation": (
        "contract:work",
        "AGENTS.md",
        "Delegation is a management boundary",
        "Delegation transfers accountability",
    ),
    "missing-repository": (
        "contract:repository",
        "AGENTS.md",
        "## Repository operations",
        "## Git operations",
    ),
    "missing-proof-route": (
        "contract:proof-route",
        "AGENTS.md",
        "knowledge/testing/test-strategy.md",
        "knowledge/testing/missing.md",
    ),
    "missing-proof-section": (
        "proof-route",
        "knowledge/testing/test-strategy.md",
        "## Proof routing",
        "## Checks",
    ),
    "missing-ponytail": (
        "contract:ponytail", "AGENTS.md", "## Ponytail", "## Minimality"
    ),
    "missing-authority": (
        "contract:authority",
        "AGENTS.md",
        "## Authority boundaries",
        "## Ownership",
    ),
}

LINK = re.compile(r"(?<!!)\[[^]]+\]\(([^)]+)\)")


def contract_problems(text: str) -> list[Problem]:
    problems = []
    for check, markers in REQUIRED.items():
        for marker in markers:
            if marker not in text:
                problems.append(Problem(check, f"AGENTS.md: missing {marker!r}"))
                break
    return problems


def local_link_problems(
    root: pathlib.Path, document: pathlib.Path, text: str
) -> list[Problem]:
    problems = []
    label = document.relative_to(root).as_posix()
    for raw in LINK.findall(text):
        target = raw.strip().strip("<>").split("#", 1)[0]
        if not target or urllib.parse.urlparse(target).scheme:
            continue
        resolved = (document.parent / urllib.parse.unquote(target)).resolve()
        try:
            resolved.relative_to(root.resolve())
        except ValueError:
            problems.append(Problem("local-link", f"{label}: {target} leaves repository"))
            continue
        if not resolved.exists():
            problems.append(Problem("local-link", f"{label}: {target} does not exist"))
    return problems


def current_markdown(root: pathlib.Path, guide: pathlib.Path) -> list[pathlib.Path]:
    """Return maintained docs, excluding historical execution plans."""
    documents = [guide]
    documents.extend(
        path
        for path in (
            root / name
            for name in ("README.md", "SECURITY.md", "CONTRIBUTING.md")
        )
        if path.exists()
    )
    for directory in (root / "knowledge", root / "tests/fixtures/locales"):
        if directory.exists():
            documents.extend(directory.rglob("*.md"))
    return sorted(set(documents))


def proof_route_problems(root: pathlib.Path) -> list[Problem]:
    strategy = root / "knowledge/testing/test-strategy.md"
    if not strategy.exists():
        return [Problem("proof-route", f"{strategy}: does not exist")]
    text = strategy.read_text(encoding="utf-8")
    if "## Proof routing" not in text:
        return [Problem("proof-route", f"{strategy}: missing '## Proof routing'")]
    return []


def validate(root: pathlib.Path, guide: pathlib.Path) -> list[Problem]:
    text = guide.read_text(encoding="utf-8")
    problems = contract_problems(text) + proof_route_problems(root)
    for document in current_markdown(root, guide):
        problems.extend(
            local_link_problems(root, document, document.read_text(encoding="utf-8"))
        )
    return problems


def selftest() -> int:
    with tempfile.TemporaryDirectory() as directory:
        root = pathlib.Path(directory)
        for relative in (
            "docs/plans/current.md",
            "knowledge/index.md",
            "knowledge/log.md",
            "knowledge/decisions/okf-query-ingest-lint.md",
            "knowledge/testing/test-strategy.md",
        ):
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("# Fixture\n", encoding="utf-8")

        guide = root / "AGENTS.md"
        markers = "\n".join(marker for values in REQUIRED.values() for marker in values)
        links = "\n".join(
            f"[fixture]({relative.replace('-', '%2D')})"
            for relative in (
                "docs/plans/current.md",
                "knowledge/index.md",
                "knowledge/log.md",
                "knowledge/decisions/okf-query-ingest-lint.md",
                "knowledge/testing/test-strategy.md",
            )
        )
        guide.write_text(f"{markers}\n{links}\n", encoding="utf-8")
        strategy = root / "knowledge/testing/test-strategy.md"
        strategy.write_text("## Proof routing\n[fixture](../index.md)\n", encoding="utf-8")

        fixtures = {
            path.relative_to(root): path.read_text(encoding="utf-8")
            for path in root.rglob("*")
            if path.is_file()
        }
        failures = []
        for name, (expected, filename, before, after) in CASES.items():
            for relative, text in fixtures.items():
                (root / relative).write_text(text, encoding="utf-8")
            path = root / filename
            text = path.read_text(encoding="utf-8")
            if expected == "local-link":
                text = text.replace(f"]({before})", f"]({after})", 1)
            else:
                text = text.replace(before, after, 1)
            path.write_text(
                text,
                encoding="utf-8",
            )
            checks = {problem.check for problem in validate(root, guide)}
            if checks != {expected}:
                failures.append(
                    f"{name}: expected check {expected!r}, got {sorted(checks) or 'nothing'}"
                )
            else:
                print(f"  ok  {name:28} trips {expected}")

    if failures:
        print("selftest FAILED:")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print(f"selftest ok — {len(CASES)} fixtures, every check observed to fail")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--selftest", action="store_true", help="prove each check can fail")
    args = parser.parse_args(argv)
    if args.selftest:
        return selftest()

    root = pathlib.Path(__file__).resolve().parent.parent
    guide = root / "AGENTS.md"
    problems = validate(root, guide)
    if problems:
        for problem in problems:
            print(f"[{problem.check}] {problem.detail}")
        return 1
    print("agent guide OK — stable contracts present; current local links resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
