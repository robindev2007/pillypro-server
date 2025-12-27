import { Request, Response, Router } from "express";

const router = Router();

// Developer info (customize as needed)
const developers = [
  {
    name: "Md Robin Mia",
    role: "Backend Developer",
    github: "https://github.com/robindev2007",
    // Add more fields as needed
  },
  // Add more developers if needed
];

router.get("/", (req: Request, res: Response) => {
  res.json({
    project: "Pilly Pro",
    developers,
  });
});

export default router;
