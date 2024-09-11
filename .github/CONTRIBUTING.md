# Contributing Guidelines

## Table of Contents

- [Contributing Guidelines](#contributing-guidelines)
  - [Table of Contents](#table-of-contents)
  - [Workflows](#workflows)
  - [Branch Management](#branch-management)
  - [Commit Messages](#commit-messages)
  - [Pull Requests](#pull-requests)
  - [Issues Naming Convention](#issues-naming-convention)
  - [Code Review](#code-review)

## Workflows

For this project, we will be using the **branching workflow** to create changes in the main repository, before using Pull Requests to merge them onto the relevant branches.

## Branch Management

When creating and managing branches to create changes to the code base, make sure to abide by the following conventions:

- **Follow the format**
  - For feature-related branches, follow the convention: `XX_YY`
    - `XX`: Name of the service or part of the service that you are fixing. E.g. _login-service_, _history-service_
    - `YY`: High-level summary of what you are doing in the PR. E.g. if you are fixing routing issues within the _Login Service_, you might want to use `fix-loging-routing`
    - Between `XX` and `YY`, make sure to include an underscore `_` to break up the service name and the summary of your changes
- **Hypenate when possible, underscore if necessary**
  - When naming the branches, attempt to hyphenate as much as you can to replace whitespace between text. E.g. when specifying the _Login Service_, use the term `login-service` over `login service` in the branch names
  - If the use of hyphens would alter the meaning of the branch name or otherwise cause confusion, replace hyphens with underscores instead
- **Once changes are implemented or rejected, delete leftover branches**. Keep the repository branches neat.

## Commit Messages

For commit messages, we will be following the [Conventional Commits standards](https://www.conventionalcommits.org/en/v1.0.0/#summary) to standardise our commit messages and to improve on the understandability of code changes between developers.

In particular, we will be using the extension of the initial set of commit types based on the [Angular convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines) for commit messages.

The overall structure of commit messages is as follow:

```text
<TYPE>(<OPTIONAL SCOPE>): <COMMIT DESCRIPTION>

<OPTIONAL COMMIT BODY>
```

> [!NOTE]
> Replace the angular brackets `<>` in whole when substituting the variable names above with your own values.

The list of valid types are as such:

- `fix`: Patches a bug within the codebase
- `feat`: Introduces a new feature or part of a feature to the codebase
- `BREAKING CHANGES` or `!` within the `<OPTIONAL SCOPE>`: Signifies that commits might cause breaking changes within other parts of the codebase (e.g. `B:` or fix())
- `build`: Build system-related commits (e.g. `npm`, `pnpm`, or any other software that helps to build and compile the codebase)
- `ci`: Commits that affects our CI/CD configuration files (e.g. GitHub Actions `yml` files)
- `docs`: Commits that update our project documentation
- `perf`: Commits that addresses a code performance issue or investigates a code performance issue
- `chore`: Small tasks that are not related to any features or fixes, but is not large enough to count as a `refactor`
- `refactor`: Commits that refactor a significant portion of the code; no features or bug fixes are made
- `style`: Commits that help improve the overall style and code quality of the codebase
- `test`: Commits that deals with unit tests and other forms of testing

`<OPTIONAL SCOPE>` can be used to indicate a specific area of focus within the `<TYPE>` that this commit is addressing. This can be left empty if the scope is obvious or stated within the `<COMMIT DESCRIPTION>`.

`<COMMIT DESCRIPTION>` must be used to provide more information on the details of the commits (e.g. changes made).

`<OPTIONAL COMMIT BODY>` can be used to provide more context of the overall

> [!CAUTION]
> Commit header should be at most **50 characters wide**, while for the optional commit body, each line should be at most **72 characters wide**.

## Pull Requests

Pull Requests are needed to merge code into protected (and sometimes non-protected) branches.

Pull Requests should follow the following format:

- **Title**
  - If the PR is related to an issue: [`<ISSUE NUMBER>`] `<DESCRIPTION OF THE PR>`
  - If not, `<DESCRIPTION OF THE PR>`
- **Body**

```markdown
<!--
    If this PR addresses a particular issue, use:   Addresses #XXXX
    If this PR references a particular issue, use:  References #XXXX

    You may include more than one line of PR references here.
-->

Addresses #XXXX

### Description

<!--
    Enter in a short description of your pull request, including:
    1. What the issue is
    2. Why is it an issue
    3. What you have done and what needs to be done
-->

### Additional information

<!--
    Enter in additional information that you wish to include in your
    PR
-->
```

> [!NOTE]
> Replace the angular brackets `<>` in whole when substituting the variable names above with your own values.

## Issues Naming Convention

To standardise the naming convention of the issues and the overall style, use any of the 6 GitHub Issues templates that is available to create issues in the established guide.

> [!CAUTION]
> Only create novel issues without issues templates if you have an issue that cannot be correctly classified, but make sure that the Issues title and body is neat and is styled with Markdown!

## Code Review

The `main` and `staging` branches are **protected branches**, meaning that force pushes are rejected, PRs need to be created to merge changes, and that an approval from one or more code reviewers is necessary in order to merge changes to either of the branches.

For `main` and `staging` specifically, an approval is needed to initiate deployments. This is to prevent GitHub Actions from running code that results in irreversible changes to cloud infrastructure and resources, while also enforcing a system of checks and balance to prevent code changes from being pushed to protected environments without the inspection from another developer.

For `dev` and any other non-protected branches, there is no such requirement: you can push to them and merge them as and how you like, as it is a sandboxed environment for you to test your code.
