/**
 * Nginx 配置模板。
 *
 * 作用：
 * - 创建项目、设置项目时共用同一份 Nginx server 模板。
 * - 保证 listen、root、proxy_pass 等关键配置的生成规则一致。
 */

/**
 * 生成 PSPM 项目的 Nginx server 配置。
 *
 * @param {object} options - 模板参数。
 * @param {string|number} options.frontendPort - Nginx listen 前端端口。
 * @param {string|number} options.backendPort - proxy_pass 代理到的后端部署端口。
 * @param {string} options.nginxIp - Nginx server_name 使用的服务器 IP。
 * @param {string} options.serverIp - 后端项目所在服务器 IP。
 * @param {string} options.frontendRoot - 前端打包资源 root 目录。
 * @returns {string} 可写入 Nginx 配置文件的 server 配置文本。
 */
export const buildProjectNginxServerTemplate = ({
  frontendPort,
  backendPort,
  nginxIp,
  serverIp,
  frontendRoot,
}) => `server {
    listen       ${String(frontendPort || '').trim()};
    server_name  ${String(nginxIp || '').trim()};

    location / {
        root   ${String(frontendRoot || '').trim()};
        index  index.html index.htm;
    }

    location /api {
        proxy_pass   http://${String(serverIp || '').trim()}:${String(backendPort || '').trim()}/api;
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Credentials' 'true';
        proxy_buffering off;
        #proxy_set_header Connection "";
        client_body_buffer_size 4096m;
        client_max_body_size 4096m;
        proxy_max_temp_file_size 4096m;
        proxy_send_timeout 1800;
        proxy_read_timeout 1800;
        proxy_next_upstream http_500 http_504 http_502 error timeout invalid_header;
    }

    error_page 404 /404.html;

    location = /40x.html {
    }
}`

