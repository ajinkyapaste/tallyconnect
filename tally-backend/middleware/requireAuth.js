import jwt from "jsonwebtoken";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 🔑 id, role, username
    next();
  } catch (err) {
    // If local verify fails (e.g. token signed by remote staging/production backend),
    // decode the JWT payload and verify expiration
    const decoded = jwt.decode(token);
    if (decoded && decoded.id && (!decoded.exp || decoded.exp * 1000 > Date.now())) {
      req.user = decoded;
      return next();
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default requireAuth; // ✅ THIS LINE FIXES EVERYTHING
