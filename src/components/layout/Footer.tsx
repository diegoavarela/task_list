import { Heart, Github, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t bg-white/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Brand & Description */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary relative"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">The Freelo List</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              A powerful task management system designed to help teams organize, track, and complete their projects with ease.
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
              <div className="flex flex-col">
                <span className="font-semibold text-primary">1k+</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Tasks</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-primary">50+</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Projects</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-primary">99%</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Satisfaction</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex-1 space-y-4">
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <a href="#tasks" className="text-muted-foreground hover:text-primary transition-colors">
                Tasks
              </a>
              <a href="#companies" className="text-muted-foreground hover:text-primary transition-colors">
                Companies
              </a>
              <a href="#tags" className="text-muted-foreground hover:text-primary transition-colors">
                Tags
              </a>
              <a href="#export" className="text-muted-foreground hover:text-primary transition-colors">
                Export Data
              </a>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="flex-1 space-y-4">
            <h4 className="text-sm font-semibold">Connect</h4>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Globe className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Have suggestions or feedback?<br />
              We'd love to hear from you!
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for productivity enthusiasts</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {currentYear} The Freelo List. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}