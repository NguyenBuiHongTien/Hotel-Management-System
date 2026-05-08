# Branch Protection Checklist (Production)

Su dung checklist nay de cau hinh branch protection cho `main`.

## 1) Bat buoc PR truoc khi merge

- [ ] Require a pull request before merging
- [ ] Require approvals: toi thieu 1-2 approvals
- [ ] Dismiss stale approvals when new commits are pushed
- [ ] Require conversation resolution before merge

## 2) Bat buoc CI pass

- [ ] Require status checks to pass before merging
- [ ] Chon check bat buoc:
  - [ ] `backend` (job backend trong `.github/workflows/ci.yml`)
  - [ ] `frontend` (job frontend trong `.github/workflows/ci.yml`)
- [ ] Require branches to be up to date before merging

## 3) Chan thao tac nguy hiem

- [ ] Block force pushes
- [ ] Block branch deletion
- [ ] Restrict who can push directly to `main` (nen de 0 nguoi)

## 4) Merge strategy

- [ ] Cho phep `Squash merge` (khuyen nghi)
- [ ] Tat `Merge commit` neu muon lich su gon
- [ ] Tat `Rebase merge` neu team khong dung

## 5) Secret & artifact hygiene

- [ ] Bat GitHub push protection / secret scanning
- [ ] Xac nhan `.gitignore` da bo qua:
  - [ ] `frontend/build/`
  - [ ] `frontend/dist/`
  - [ ] `compose.resolved.yml`
  - [ ] `compose.dev.resolved.yml`

## 6) Governance (khuyen nghi)

- [ ] Require signed commits (neu team can)
- [ ] Require CODEOWNERS review cho khu vuc nhay cam:
  - [ ] `backend/controllers/`
  - [ ] `backend/middleware/`
  - [ ] `docker-compose.yml`
  - [ ] `.github/workflows/`
