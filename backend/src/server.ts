import express from "express";
import cors from "cors";
import multer from "multer";
import { z } from "zod";
import type { Express } from "express";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 25 * 1024 * 1024, files: 10 },
});

const requestSchema = z.object({
	question: z.string().min(1, "Question is required"),
});

app.post("/api/ask", upload.array("files", 10), (req, res) => {
	try {
		const parse = requestSchema.safeParse(req.body);
		if (!parse.success) {
			return res.status(400).json({ error: parse.error.format() });
		}

		const question = parse.data.question;
		const files = (req.files as Express.Multer.File[]) || [];

		const fileSummaries = files.map((f) => ({
			originalName: f.originalname,
			mimeType: f.mimetype,
			sizeBytes: f.size,
		}));

		return res.json({
			message: "Received question and files successfully",
			question,
			files: fileSummaries,
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`Backend running on http://localhost:${PORT}`);
});
