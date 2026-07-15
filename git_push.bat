"C:\Program Files\Git\cmd\git.exe" init
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Preparando para Cloudflare Pages"
"C:\Program Files\Git\cmd\git.exe" branch -M main
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/luanbcosta/coletadados.git
"C:\Program Files\Git\cmd\git.exe" push -u origin main --force
