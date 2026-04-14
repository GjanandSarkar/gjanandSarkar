# 🤝 Contributing to DairyDirect

First of all, thank you for considering contributing to DairyDirect! It's people like you that make open-source such an amazing place.

## 🌈 How Can I Contribute?

### 1. Reporting Bugs
- Check the issues tab to see if it's already reported.
- Be as detailed as possible. Include screenshots if it's a UI issue.

### 2. Suggesting Enhancements
- Open an issue with the [Feature] prefix.
- Describe the use case and why the feature is needed.

### 3. Code Contributions
- Fork the repository.
- Create a new branch: `feature/amazing-feature`.
- Keep changes small and focused.
- Ensure your code follows the existing style (TypeScript + Tailwind).

## 👩‍💻 Local Development Workflow

1. **Install All dependencies**:
   ```bash
   npm run install:all
   ```

2. **Run both Frontend and Backend (Optional)**:
   ```bash
   # Starts Next.js
   npm run dev:frontend
   
   # Starts Standalone Express Service (if needed)
   npm run dev:backend
   ```

3. **Database Changes**:
   - Update `dairydirect/database/supabase/schema.sql` with your new table/column definitions.
   - Use the Supabase CLI if you're comfortable, or directly update it in the portal.

## 🤖 AI Contribution Guidelines

If you are using AI tools (Cursor, GitHub Copilot, etc.) to contribute:
- Please review and clean up AI-generated comments.
- Ensure any new "vibe" matches the existing liquid-smooth design language.
- Update `system_prompts` if you add complex new abstractions.

## 📬 Questions?
Feel free to open an "Engagement" issue for any architectural questions!
