import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from './Button'
import { punctuationApi } from '@/lib/api'

export function VoiceInput({ onTranscript, disabled }) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const onTranscriptRef = useRef(onTranscript)

  // Оновлюємо ref коли змінюється callback
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    // Перевіряємо чи браузер підтримує Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = true // Продовжує слухати
      recognitionInstance.interimResults = true // Показує проміжні результати
      recognitionInstance.lang = 'uk-UA' // Українська мова
      recognitionInstance.maxAlternatives = 1
      
      let finalTranscript = ''
      
      recognitionInstance.onresult = async (event) => {
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        // Відправляємо тільки фінальний текст
        if (finalTranscript) {
          const rawText = finalTranscript.trim()
          console.log('Розпізнано:', rawText)
          
          // Обробляємо через Groq API
          setIsProcessing(true)
          try {
            const response = await punctuationApi.addPunctuation(rawText)
            const processedText = response.data.text
            console.log('Оброблено:', processedText)
            onTranscriptRef.current(processedText)
          } catch (error) {
            console.error('Помилка обробки тексту:', error)
            // Якщо помилка - вставляємо оригінальний текст
            onTranscriptRef.current(rawText)
          } finally {
            setIsProcessing(false)
          }
          
          finalTranscript = ''
        }
      }
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          alert('Дозвольте доступ до мікрофона в налаштуваннях браузера')
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsListening(false)
        }
      }
      
      recognitionInstance.onend = () => {
        console.log('Запис завершено')
        setIsListening(false)
        finalTranscript = ''
      }
      
      setRecognition(recognitionInstance)
    }
  }, [])

  const toggleListening = () => {
    if (!recognition) {
      alert('Ваш браузер не підтримує голосовий ввід. Спробуйте Chrome або Edge.')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  return (
    <Button
      type="button"
      variant={isListening ? "default" : "ghost"}
      size="sm"
      onClick={toggleListening}
      disabled={disabled || isProcessing}
      className={isListening ? "animate-pulse" : ""}
      title={
        isProcessing 
          ? "Обробка тексту..." 
          : isListening 
            ? "Зупинити запис" 
            : "Голосовий ввід"
      }
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  )
}
