# About Tutorix

## Overview

**Tutorix** is an innovative AI-powered tutoring platform that combines voice-based AI instruction with intelligent whiteboard visualization to create an immersive, interactive learning experience. The system leverages multiple AI agents working in coordination to deliver personalized educational content that adapts to any topic in real-time.

## 🎯 Vision

Traditional online learning often lacks the engagement and visual clarity of in-person instruction. Tutorix bridges this gap by providing an AI tutor that can both speak and write, creating a classroom-like experience where students can see concepts being drawn and explained simultaneously—just like learning from a real teacher with a whiteboard.

## 🏗️ Architecture

Tutorix is built as a **multi-agent system** where specialized AI agents collaborate to deliver comprehensive tutoring:

### Core Agents

1. **📚 Lesson Planner Agent**
   - Analyzes user-provided topics
   - Creates structured lesson plans with subtopics
   - Generates detailed whiteboard content for each section
   - Optimizes lesson duration and pacing

2. **🎙️ Voice AI Tutor (Vapi Agent)**
   - Provides real-time voice instruction
   - Follows the generated lesson plan
   - Interacts naturally with students
   - Triggers whiteboard updates at appropriate moments

3. **✏️ Whiteboard Writer Agent**
   - Receives prompts from the voice tutor
   - Generates visual content on the tldraw canvas
   - Creates diagrams, formulas, bullet points, and illustrations
   - Synchronizes visual content with audio instruction

## 🔄 System Flow

### 1. Topic Input & Lesson Generation
- Student enters a topic and preferred lesson duration
- Lesson Planner Agent creates a comprehensive lesson plan using OpenAI
- Plan includes structured subtopics with detailed whiteboard content
- Lesson data is stored in Supabase database

### 2. Interactive Teaching Session
- Student navigates to the lesson page with an interactive whiteboard
- Vapi Voice AI Tutor begins teaching the first subtopic
- Real-time Server-Sent Events (SSE) connection established

### 3. Synchronized Whiteboard Updates
- When each subtopic begins, Voice AI Tutor calls a webhook
- Webhook triggers the Whiteboard Writer Agent
- Agent processes the subtopic content and generates visual elements
- Whiteboard updates in real-time as the tutor speaks

### 4. Continuous Learning Loop
- Process repeats for each subtopic in the lesson plan
- Students can ask questions and interact with the AI tutor
- Session concludes with summary and option to end the call

## 🛠️ Technical Stack

### Frontend
- **React** with TypeScript for the user interface
- **tldraw** for the interactive whiteboard canvas
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Vapi Web SDK** for voice AI integration

### Backend
- **Cloudflare Workers** for serverless API endpoints
- **OpenAI GPT-4** for lesson planning and content generation
- **Supabase** for data storage and retrieval
- **Server-Sent Events (SSE)** for real-time communication
- **Webhook system** for agent coordination

### Key Technologies
- **tldraw AI** for intelligent whiteboard content generation
- **Vapi** for natural voice AI conversations
- **Real-time streaming** for responsive AI interactions
- **Multi-agent coordination** via webhooks and SSE

## 🌟 Key Features

### Intelligent Lesson Planning
- Automatically generates structured curricula for any topic
- Optimizes content for specified time durations (3-10 minutes)
- Creates detailed whiteboard content aligned with teaching objectives

### Natural Voice Interaction
- Human-like AI tutor with natural conversation flow
- Real-time voice responses and interaction
- Ability to answer questions and clarify concepts

### Dynamic Visual Learning
- Intelligent whiteboard that draws concepts as they're explained
- Supports various content types: formulas, diagrams, bullet points, examples
- Real-time synchronization between voice and visual content

### Personalized Experience
- Adapts to any topic or subject matter
- Customizable lesson duration
- Interactive Q&A throughout the session

## 🚀 Getting Started

### For Students
1. Visit the platform and enter your desired learning topic
2. Select your preferred lesson duration
3. Start your personalized tutoring session
4. Interact with the AI tutor through voice and visual learning

### For Developers
The system is built with modern web technologies and can be extended with additional agents or features. The modular architecture allows for easy customization and scaling.

## 🎓 Use Cases

- **Students** seeking personalized tutoring on any subject
- **Educators** looking for AI-assisted teaching tools  
- **Professionals** needing quick explanations of complex topics
- **Organizations** providing scalable training solutions

## 🔮 Future Enhancements

- Multi-language support for global accessibility
- Advanced whiteboard interactions (student drawing capabilities)
- Integration with learning management systems
- Performance analytics and learning progress tracking
- Collaborative learning sessions with multiple students

---

**Tutorix** represents the next evolution in AI-powered education, combining the best aspects of human tutoring with the scalability and accessibility of artificial intelligence. By orchestrating multiple specialized AI agents, we create learning experiences that are both highly personalized and visually engaging. 