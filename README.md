# Tutorix - AI-Powered Interactive Tutoring Platform

<div align="center">

![Tutorix Logo](https://via.placeholder.com/200x80/4285f4/ffffff?text=Tutorix)

**Transform any topic into an engaging, personalized learning experience**

[🚀 Quickstart](#quickstart) • [📖 Documentation](#documentation) • [🎯 Features](#features) • [🏗️ Architecture](#architecture)

</div>

## Overview

**Tutorix** is an innovative AI-powered tutoring platform that combines voice-based instruction with intelligent whiteboard visualization to create immersive, interactive learning experiences. Built as a multi-agent system, Tutorix orchestrates specialized AI agents to deliver personalized education that adapts to any topic in real-time.

### 🎯 The Vision

Traditional online learning often lacks the engagement and visual clarity of in-person instruction. Tutorix bridges this gap by providing an AI tutor that can both speak and write, creating a classroom-like experience where students can see concepts being drawn and explained simultaneously—just like learning from a real teacher with a whiteboard.

## ✨ Key Features

### 🎙️ **Voice-Powered AI Tutor**
- Natural conversation flow with students
- Real-time voice responses and interaction
- Contextual teaching based on lesson plans
- Automatic session management

### 🎨 **Intelligent Whiteboard**
- Real-time visual content generation
- Synchronized audio and visual learning
- Support for formulas, diagrams, and educational content
- Smart positioning and layout management

### 🧠 **Multi-Agent Architecture**
- **Lesson Planner Agent**: Creates structured curricula from any topic
- **Voice AI Tutor**: Provides real-time instruction and interaction
- **Whiteboard Writer Agent**: Generates visual content synchronized with teaching

### 🔄 **Real-Time Synchronization**
- Server-Sent Events for instant updates
- Webhook-based agent coordination
- Seamless integration between voice and visual content

### 📚 **Adaptive Learning**
- Personalized lesson plans for any subject
- Customizable duration (3-10 minutes)
- Interactive Q&A throughout sessions
- Progress tracking and session management

## 🔮 Upcoming Features

### 📊 **Dynamic Visual Generation**
- **AI-Generated Diagrams & Charts**: The whiteboard writer agent will automatically create complex diagrams, flowcharts, and data visualizations while teaching
- **Contextual Visual Content**: Real-time generation of graphs, mind maps, and educational illustrations that perfectly complement the lesson content
- **Interactive Visual Elements**: Students will be able to interact with generated charts and diagrams for deeper understanding

### 🤝 **Live Collaborative Learning**
- **Real-Time Co-Creation**: Students can draw, annotate, and contribute directly to the whiteboard alongside the AI tutor
- **Interactive Problem Solving**: Work together with the AI to solve problems, complete diagrams, and build concepts collaboratively
- **Shared Learning Canvas**: A truly immersive experience where both student and AI contribute to the learning journey in real-time
- **Guided Participation**: The AI tutor will intelligently guide student contributions and provide real-time feedback on their input

*These features will transform Tutorix from an AI-assisted learning platform into a truly collaborative educational experience.*

## 🏗️ Architecture

Tutorix is built on a modern, scalable architecture:

- **Frontend**: React 18 + TypeScript + tldraw + Vapi Web SDK
- **Backend**: Cloudflare Workers + Durable Objects + OpenAI API
- **Database**: Supabase for lesson persistence
- **Real-time**: Server-Sent Events + Webhook coordination
- **Voice AI**: Vapi platform integration
- **Deployment**: Serverless architecture with global edge distribution

## 🚀 Quickstart

Get up and running in 10 minutes:

```bash
# 1. Clone and install
git clone <repository-url>
cd tutorix
pnpm install

# 2. Set up environment variables
# Create .dev.vars and .env.local (see quickstart guide)

# 3. Start services
node webhook-dev-server.js  # Terminal 1
./setup-ngrok.sh           # Terminal 2  
pnpm dev                   # Terminal 3
```

**👉 [Follow the detailed quickstart guide](./docs/quickstart.md) for complete setup instructions.**

## 📖 Documentation

### 📋 Setup Guides
- **[Quickstart Guide](./docs/quickstart.md)** - Get running in 10 minutes
- **[Supabase Setup](./docs/supabase_setup.md)** - Database configuration
- **[Vapi Setup](./docs/vapi_setup.md)** - Voice AI integration

### 🔧 Technical Documentation
- **[Technical Documentation](./docs/technical-documentation.md)** - Complete system architecture
- **[API Reference](./docs/technical-documentation.md#api-endpoints)** - Endpoint documentation
- **[Component Guide](./docs/technical-documentation.md#system-components)** - Frontend components

## 🎯 Use Cases

- **Students** seeking personalized tutoring on any subject
- **Educators** looking for AI-assisted teaching tools
- **Professionals** needing quick explanations of complex topics
- **Organizations** providing scalable training solutions

## 🛠️ Tech Stack

### Core Technologies
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **tldraw** - Interactive whiteboard canvas
- **Vapi** - Voice AI platform
- **OpenAI GPT-4** - AI content generation

### Infrastructure
- **Cloudflare Workers** - Serverless compute
- **Supabase** - Database and real-time features
- **Server-Sent Events** - Real-time updates
- **Webhook Architecture** - Agent coordination

## 🌟 Demo

### How It Works

1. **Enter a Topic** - Student inputs any subject they want to learn
2. **AI Generates Lesson** - Lesson Planner Agent creates structured curriculum
3. **Voice Teaching Begins** - AI tutor starts speaking and teaching
4. **Whiteboard Updates** - Visual content appears synchronized with speech
5. **Interactive Learning** - Student can ask questions and get clarifications
6. **Session Completion** - AI provides summary and ends the session

### Example Learning Flow
```
Student: "I want to learn about photosynthesis"
│
├── 🧠 Lesson Planner Agent → Creates 5-minute structured lesson
├── 🎙️ Voice AI Tutor → "Let's start with the introduction..."
├── 📝 Whiteboard Writer → Draws diagrams and definitions
├── 🔄 Real-time Sync → Voice and visuals perfectly aligned
└── ✅ Complete Learning Experience
```

## 🚧 Development

### Prerequisites
- Node.js 18+
- pnpm package manager
- OpenAI API key
- Supabase account
- Vapi account

### Local Development
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .dev.vars.example .dev.vars
cp .env.local.example .env.local

# Start development servers
pnpm dev
```

### Contributing
We welcome contributions! Please see our [technical documentation](./docs/technical-documentation.md) for development guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

Built with:
- [tldraw](https://tldraw.dev) for the incredible whiteboard technology
- [OpenAI](https://openai.com) for powerful AI capabilities
- [Vapi](https://vapi.ai) for voice AI integration
- [Supabase](https://supabase.com) for database and real-time features
- [Cloudflare](https://cloudflare.com) for serverless infrastructure

## 📞 Support

- **Documentation**: Comprehensive guides available in `/docs`
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Questions**: Check our [technical documentation](./docs/technical-documentation.md)

---

<div align="center">

**Tutorix** - *The future of AI-powered education*

Made with ❤️ by [Your Team](https://github.com/your-profile)

</div>
