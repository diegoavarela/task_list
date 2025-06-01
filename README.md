# The Freelo List

A task management application built with React, TypeScript, and Vite. This application allows users to manage tasks associated with different companies, with features like task completion tracking, company color coding, and data export capabilities.

## Features

- Task management with completion tracking
- Company management with color coding
- Show/hide completed tasks
- Export data to JSON and CSV formats
- Responsive design with dark mode support
- Local storage for data persistence

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd task_list
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

1. Create a production build:
```bash
npm run build
```

This will create a `dist` directory with the production-ready files.

## Deployment

### Option 1: Static Hosting (Recommended)

The application can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

1. Build the application:
```bash
npm run build
```

2. Deploy the contents of the `dist` directory to your hosting service.

### Option 2: Traditional Web Server

1. Build the application:
```bash
npm run build
```

2. Copy the contents of the `dist` directory to your web server's public directory.

3. Configure your web server (e.g., Nginx, Apache) to serve the static files:

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. Restart your web server.

### Option 3: Docker Deployment

1. Create a Dockerfile in the project root:
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create an nginx.conf file:
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

3. Build and run the Docker container:
```bash
docker build -t task-list .
docker run -p 80:80 task-list
```

## Environment Variables

The application currently doesn't require any environment variables. All data is stored in the browser's local storage.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
