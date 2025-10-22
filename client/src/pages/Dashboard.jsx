import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '@/contexts/AuthContext'
import { ideasApi } from '@/lib/api'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { Card } from '@/components/Card'
import { VoiceInput } from '@/components/VoiceInput'
import { formatDate } from '@/lib/utils'
import { 
  Lightbulb, 
  LogOut, 
  Sparkles, 
  BookmarkPlus, 
  Bookmark,
  Star,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react'

export default function Dashboard() {
  const [topic, setTopic] = useState('')
  const [ideas, setIdeas] = useState([])
  const [guestIdeas, setGuestIdeas] = useState([]) // Ідеї для гостьового режиму
  const [loading, setLoading] = useState(false)
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadIdeas()
    } else {
      // Очищаємо ідеї якщо користувач не авторизований
      setIdeas([])
    }
  }, [showSavedOnly, user])

  const loadIdeas = async () => {
    if (!user) return
    try {
      const response = await ideasApi.getAll(showSavedOnly)
      setIdeas(response.data)
    } catch (error) {
      console.error('Error loading ideas:', error)
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    try {
      // Використовуємо гостьовий режим якщо не авторизовані
      const response = user 
        ? await ideasApi.generate(topic)
        : await ideasApi.generateGuest(topic)
      
      // Додаємо до відповідного списку
      if (user) {
        setIdeas([response.data, ...ideas])
      } else {
        // В гостьовому режимі зберігаємо тільки останню ідею
        setGuestIdeas([response.data])
        alert('💡 Ідея згенерована!\n\nВ гостьовому режимі ви можете переглянути тільки останню ідею.\nЗареєструйтесь щоб зберігати історію ідей.')
      }
      
      setTopic('')
    } catch (error) {
      console.error('Error generating idea:', error)
      alert('Помилка генерації ідеї. Перевірте налаштування API.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSave = async (id, currentlySaved) => {
    if (!user) {
      alert('Зареєструйтесь щоб зберігати ідеї')
      return
    }
    try {
      await ideasApi.update(id, { is_saved: !currentlySaved })
      setIdeas(ideas.map(idea => 
        idea.id === id ? { ...idea, is_saved: !currentlySaved } : idea
      ))
    } catch (error) {
      console.error('Error toggling save:', error)
    }
  }

  const rateIdea = async (id, rating) => {
    if (!user || !id) {
      // Локальне оцінювання для гостей
      setIdeas(ideas.map(idea => 
        idea.id === id ? { ...idea, rating } : idea
      ))
      return
    }
    try {
      await ideasApi.update(id, { rating })
      await ideasApi.addFeedback(id, rating >= 4 ? 'positive' : 'negative')
      setIdeas(ideas.map(idea => 
        idea.id === id ? { ...idea, rating } : idea
      ))
    } catch (error) {
      console.error('Error rating idea:', error)
    }
  }

  const deleteIdea = async (id) => {
    if (!confirm('Видалити цю ідею?')) return

    if (!user) {
      // Локальне видалення для гостей
      setGuestIdeas(guestIdeas.filter(idea => idea.id !== id))
      return
    }

    try {
      await ideasApi.delete(id)
      setIdeas(ideas.filter(idea => idea.id !== id))
    } catch (error) {
      console.error('Error deleting idea:', error)
    }
  }

  const handleLogout = () => {
    setIdeas([]) // Очищаємо ідеї користувача
    setGuestIdeas([]) // Очищаємо гостьові ідеї
    logout()
    alert('✅ Ви перейшли в гостьовий режим.\n\nЩоб знову побачити історію ідей, увійдіть в акаунт.')
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Генератор Стартап-Ідей</h1>
              <p className="text-sm text-muted-foreground">
                {user ? `Вітаємо, ${user.name}` : 'Гостьовий режим'}
              </p>
            </div>
          </div>
          {user ? (
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Вийти
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Увійти
              </Button>
              <Button onClick={() => navigate('/register')}>
                Реєстрація
              </Button>
            </div>
          )}
        </div>

        {/* Generator Form */}
        <Card className="mb-8 animate-fadeIn">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Введіть тему або напрямок стартапу
                </label>
                <VoiceInput 
                  onTranscript={(text) => setTopic(prev => prev ? prev + ' ' + text : text)}
                  disabled={loading}
                />
              </div>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Наприклад: штучний інтелект для освіти, автоматизація бізнес-процесів, або опишіть детальніше що саме ви хочете автоматизувати..."
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Генерація...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Згенерувати ідею
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Filter */}
        {user && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {showSavedOnly ? 'Збережені ідеї' : 'Всі ідеї'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {showSavedOnly ? 'Показати всі' : 'Тільки збережені'}
            </Button>
          </div>
        )}

        {/* Ideas List */}
        <div className="grid gap-4">
          {(user ? ideas : guestIdeas).length === 0 ? (
            <Card className="text-center py-12">
              <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {user 
                  ? (showSavedOnly ? 'Немає збережених ідей' : 'Згенеруйте свою першу стартап-ідею')
                  : 'Згенеруйте ідею щоб побачити результат'}
              </p>
            </Card>
          ) : (
            (user ? ideas : guestIdeas).map((idea) => (
              <Card 
                key={idea.id} 
                className={`animate-fadeIn hover:bg-white/10 transition-all cursor-pointer relative ${
                  !idea.is_read ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20' : ''
                }`}
                onClick={() => navigate(`/idea/${idea.id}`)}
              >
                {!idea.is_read && (
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold mb-1">{idea.title}</h3>
                      {!idea.is_read && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                          Нова
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {idea.topic} • {formatDate(idea.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSave(idea.id, idea.is_saved)}
                    >
                      {idea.is_saved ? (
                        <Bookmark className="w-4 h-4 fill-current" />
                      ) : (
                        <BookmarkPlus className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteIdea(idea.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-4 text-sm text-muted-foreground line-clamp-3 markdown-content">
                  <ReactMarkdown>{idea.content.substring(0, 300)}</ReactMarkdown>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => rateIdea(idea.id, star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= (idea.rating || 0)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/idea/${idea.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Переглянути
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
