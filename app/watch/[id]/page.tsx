"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  PictureInPicture2,
  Loader2,
} from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true) // For initial movie data fetch
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentQuality, setCurrentQuality] = useState<"480p" | "720p" | "1080p">("720p")
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1) // 0 to 1
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true) // For video buffering state
  const [showSettingsMenu, setShowSettingsMenu] = useState(false) // For quality/speed menu
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // For playback speed control

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async (movieId: string) => {
      setLoading(true)
      try {
        const response = await fetch(`https://web-production-6321.up.railway.app/movies/${movieId}`)
        if (!response.ok) throw new Error("Movie not found")
        const movieData: Movie = await response.json()
        setMovie(movieData)
        // Set initial video source to 720p
        setVideoSrc(movieData.video_link_720p)
        setCurrentQuality("720p")
      } catch (err) {
        setError("Failed to fetch movie details.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMovie(id)
    }
  }, [id])

  // Handle fullscreen change events (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(document.fullscreenElement != null)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Update video source when quality changes
  useEffect(() => {
    if (movie) {
      const prevTime = videoRef.current?.currentTime || 0
      const prevPlaying = !videoRef.current?.paused

      let newSrc = ""
      if (currentQuality === "480p") newSrc = movie.video_link_480p
      else if (currentQuality === "720p") newSrc = movie.video_link_720p
      else if (currentQuality === "1080p") newSrc = movie.video_link_1080p

      setVideoSrc(newSrc)

      // Load new source and maintain playback state/time
      if (videoRef.current) {
        videoRef.current.load()
        videoRef.current.currentTime = prevTime
        if (prevPlaying) {
          videoRef.current.play().catch((e) => console.error("Autoplay prevented:", e))
        }
      }
    }
  }, [currentQuality, movie])

  // Video player controls
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((e) => console.error("Play prevented:", e))
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsBuffering(false) // Video metadata loaded, stop initial buffering indicator
      // Autoplay on load, but handle browser restrictions
      videoRef.current.play().catch((e) => console.error("Autoplay prevented on metadata load:", e))
      setIsPlaying(true)
    }
  }, [])

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Number(e.target.value)
      setCurrentTime(Number(e.target.value))
    }
  }, [])

  const toggleFullScreen = useCallback(() => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch((e) => console.error("Fullscreen failed:", e))
        setIsFullScreen(true)
      } else {
        document.exitFullscreen()
        setIsFullScreen(false)
      }
    }
  }, [])

  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
      setPlaybackSpeed(speed)
      setShowSettingsMenu(false)
    }
  }, [])

  const togglePictureInPicture = useCallback(() => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch((e) => console.error("Exit PiP failed:", e))
      } else {
        videoRef.current.requestPictureInPicture().catch((e) => console.error("Enter PiP failed:", e))
      }
    }
  }, [])

  // Handle video buffering events
  const handleWaiting = useCallback(() => setIsBuffering(true), [])
  const handlePlaying = useCallback(() => setIsBuffering(false), [])
  const handleSeeking = useCallback(() => setIsBuffering(true), [])
  const handleSeeked = useCallback(() => setIsBuffering(false), [])

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
  const availableQualities = [
    movie?.video_link_480p && "480p",
    movie?.video_link_720p && "720p",
    movie?.video_link_1080p && "1080p",
  ].filter(Boolean) as ("480p" | "720p" | "1080p")[]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-400 mb-4">{error || "Movie details could not be loaded."}</p>
          <Link
            href="/home"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <div className="w-full max-w-6xl mb-6">
        <Link
          href={`/movie/${movie.id}`}
          className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Movie Details</span>
        </Link>
      </div>

      {/* Movie Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 max-w-6xl w-full">
        {movie.title.split("(")[0].trim()}
      </h1>

      {/* Video Player Container */}
      <div className="w-full max-w-4xl bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <div className="relative w-full aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoSrc || undefined}
            autoPlay // Autoplay as requested
            onPlay={handlePlaying}
            onPause={togglePlayPause} // Use togglePlayPause to update state
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => console.error("Video error:", e.currentTarget.error)}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onSeeking={handleSeeking}
            onSeeked={handleSeeked}
            className="w-full h-full object-contain" // Use object-contain to prevent cropping
            playsInline // Add playsInline for better mobile compatibility (especially iOS)
            // Removed 'controls' attribute to rely fully on custom controls for Plyr-like experience
          />

          {/* Loading Spinner Overlay */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
          )}

          {/* Custom Controls Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
            <div className="p-4">
              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleProgressChange}
                className="w-full h-2 bg-blue-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                aria-label="Video progress"
              />
              <div className="flex justify-between items-center mt-2 text-sm text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlayPause}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-6 w-6 text-white" />
                    ) : (
                      <Volume2 className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    aria-label="Volume control"
                  />
                </div>

                <div className="flex items-center space-x-4 relative">
                  {/* Settings Menu Trigger */}
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Settings"
                    aria-expanded={showSettingsMenu}
                  >
                    <Settings className="h-6 w-6 text-white" />
                  </button>

                  {/* Settings Menu Dropdown */}
                  {showSettingsMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-40 bg-gray-800 rounded-lg shadow-lg p-2 text-sm z-20">
                      <div className="font-semibold text-gray-300 px-2 py-1">Quality</div>
                      {availableQualities.map((quality) => (
                        <button
                          key={quality}
                          onClick={() => {
                            setCurrentQuality(quality)
                            setShowSettingsMenu(false)
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-700 transition-colors ${
                            currentQuality === quality ? "bg-blue-600 text-white" : "text-gray-300"
                          }`}
                        >
                          {quality}
                        </button>
                      ))}
                      <div className="font-semibold text-gray-300 px-2 py-1 mt-2 border-t border-gray-700 pt-2">
                        Playback Speed
                      </div>
                      {playbackSpeeds.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handlePlaybackSpeedChange(speed)}
                          className={`w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-700 transition-colors ${
                            playbackSpeed === speed ? "bg-blue-600 text-white" : "text-gray-300"
                          }`}
                        >
                          {speed === 1 ? "Normal" : `${speed}x`}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Picture-in-Picture Button */}
                  {document.pictureInPictureEnabled && (
                    <button
                      onClick={togglePictureInPicture}
                      className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                      aria-label="Toggle Picture-in-Picture"
                    >
                      <PictureInPicture2 className="h-6 w-6 text-white" />
                    </button>
                  )}

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullScreen}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isFullScreen ? (
                      <Minimize className="h-6 w-6 text-white" />
                    ) : (
                      <Maximize className="h-6 w-6 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
