
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const EnhancedBackground = ({ theme }: { theme: 'light' | 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 40;
    const connections = 3;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const { innerWidth, innerHeight } = window;
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      
      // Recreate particles when canvas is resized
      initParticles();
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      connectedTo: Set<number>;

      constructor(isDark: boolean) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.size = Math.random() * 2 + 1;
        this.connectedTo = new Set();
        
        if (isDark) {
          // Teal and purple tones for dark theme
          const colors = ['rgba(45, 212, 191, 0.7)', 'rgba(168, 85, 247, 0.7)', 'rgba(99, 102, 241, 0.7)'];
          this.color = colors[Math.floor(Math.random() * colors.length)];
        } else {
          // Softer colors for light theme
          const colors = ['rgba(20, 184, 166, 0.4)', 'rgba(139, 92, 246, 0.3)', 'rgba(79, 70, 229, 0.3)'];
          this.color = colors[Math.floor(Math.random() * colors.length)];
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(theme === 'dark'));
      }
    };

    const drawConnections = () => {
      if (!ctx) return;
      
      // Reset connections
      particles.forEach(p => {
        p.connectedTo.clear();
      });

      // Create a distance matrix
      const distances: Array<{i: number, j: number, distance: number}> = [];
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          distances.push({i, j, distance});
        }
      }
      
      // Sort distances
      distances.sort((a, b) => a.distance - b.distance);
      
      // Draw the closest connections
      distances.forEach(({i, j, distance}) => {
        const p1 = particles[i];
        const p2 = particles[j];
        
        // Only connect if both particles have fewer than the max connections
        if (p1.connectedTo.size < connections && p2.connectedTo.size < connections) {
          // Only connect if the distance is appropriate 
          if (distance < Math.min(canvas.width, canvas.height) * 0.2) {
            p1.connectedTo.add(j);
            p2.connectedTo.add(i);
            
            // Draw line
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            const opacity = Math.max(0, 1 - distance / (Math.min(canvas.width, canvas.height) * 0.2));
            
            if (theme === 'dark') {
              ctx.strokeStyle = `rgba(99, 102, 241, ${opacity * 0.5})`;
            } else {
              ctx.strokeStyle = `rgba(20, 184, 166, ${opacity * 0.3})`;
            }
            
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
          }
        }
      });
    };

    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Draw connections
      drawConnections();
      
      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.15, 0.2],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-1/2 -left-1/2 w-full h-full opacity-10"
      >
        <div className="w-full h-full bg-gradient-to-br from-teal-400 to-purple-500 rounded-full blur-3xl" />
      </motion.div>
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.2, 0.15],
          rotate: [0, 15, 0, -15, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-10"
      >
        <div className="w-full h-full bg-gradient-to-bl from-yellow-400 to-pink-500 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
};
