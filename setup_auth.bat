@echo off
echo STARTING > setup_auth.log
call npm install bcryptjs @types/bcryptjs >> setup_auth.log 2>&1
echo NPM DONE >> setup_auth.log
call npx prisma migrate dev --name add_auth >> setup_auth.log 2>&1
echo ALL DONE >> setup_auth.log
