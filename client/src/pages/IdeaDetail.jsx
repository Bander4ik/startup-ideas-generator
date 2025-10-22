import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ideasApi, chatApi } from '@/lib/api'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Textarea } from '@/components/Textarea'
import { VoiceInput } from '@/components/VoiceInput'
import { formatDate } from '@/lib/utils'
import { 
  ArrowLeft, 
  MessageCircle, 
  Send, 
  Trash2,
  Star,
  Bookmark,
  BookmarkPlus,
  Loader2
} from 'lucide-react'

export default function IdeaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [idea, setIdea] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    loadIdea()
    loadChatHistory()
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadIdea = async () => {
    try {
      const response = await ideasApi.getById(id)
      setIdea(response.data)
    } catch (error) {
      console.error('Error loading idea:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadChatHistory = async () => {
    try {
      const response = await chatApi.getHistory(id)
      setChatHistory(response.data)
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    const userMessage = message
    setMessage('')
    setSending(true)

    // Додаємо повідомлення користувача одразу
    setChatHistory([...chatHistory, {
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }])

    try {
      const response = await chatApi.sendMessage(userMessage, id)
      setChatHistory(prev => [...prev, response.data])
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Помилка відправки повідомлення')
    } finally {
      setSending(false)
    }
  }

  const toggleSave = async () => {
    try {
      await ideasApi.update(id, { is_saved: !idea.is_saved })
      setIdea({ ...idea, is_saved: !idea.is_saved })
    } catch (error) {
      console.error('Error toggling save:', error)
    }
  }

  const rateIdea = async (rating) => {
    try {
      await ideasApi.update(id, { rating })
      await ideasApi.addFeedback(id, rating >= 4 ? 'positive' : 'negative')
      setIdea({ ...idea, rating })
    } catch (error) {
      console.error('Error rating idea:', error)
    }
  }

  const clearChat = async () => {
    if (!confirm('Очистити історію чату?')) return

    try {
      await chatApi.clearHistory(id)
      setChatHistory([])
    } catch (error) {
      console.error('Error clearing chat:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!idea) return null

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleSave}>
              {idea.is_saved ? (
                <Bookmark className="w-4 h-4 fill-current" />
              ) : (
                <BookmarkPlus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Idea Content */}
          <div className="space-y-6">
            <Card className="animate-fadeIn">
              <div className="mb-4">
                <h1 className="text-2xl font-bold mb-2">{idea.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {idea.topic} • {formatDate(idea.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => rateIdea(star)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (idea.rating || 0)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="prose prose-invert max-w-none markdown-content">
                <ReactMarkdown>{idea.content}</ReactMarkdown>
              </div>
            </Card>
          </div>

          {/* Chat */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Уточнення ідеї</h2>
                </div>
                {chatHistory.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearChat}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4 mb-4 max-h-[600px] min-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Задайте питання щодо цієї ідеї
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'glass-strong border border-primary/20'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="text-sm markdown-content prose prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                        <p className="text-xs opacity-60 mt-2">
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3 pt-4 border-t border-border">
                <div className="relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Задайте питання про ідею..."
                    rows={2}
                    disabled={sending}
                    className="resize-none pr-12"
                  />
                  <div className="absolute right-2 top-2">
                    <VoiceInput 
                      onTranscript={(text) => setMessage(prev => prev ? prev + ' ' + text : text)}
                      disabled={sending}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={sending || !message.trim()}>
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Відправка...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Відправити
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
