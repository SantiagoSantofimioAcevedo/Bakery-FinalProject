import express from 'express';

// 🔄 Extender el tipo Request para incluir req.user
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;  // O ajusta el tipo según lo que guardes en req.user (por ejemplo: `user?: { id: string; name: string }`)
  }
}
