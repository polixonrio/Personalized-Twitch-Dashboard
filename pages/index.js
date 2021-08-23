// Main entry point of your app
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import StreamerGrid from '../components/StreamerGrid'
import styles from '../styles/Home.module.css'

const Home = () => {
  //useState
  const [favoriteChannels, setFavoriteChannels] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  //Actions
  const addStreamChannel = async event => {
    // Prevent the page from redirecting
    event.preventDefault()

    const { value } = event.target.elements.name

    if (value) {
      console.log('Input: ', value)

      //Call Twitch Search API
      const path = `https://${window.location.hostname}`

      const response = await fetch(`${path}/api/twitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: value })
      })

      const json = await response.json()

      console.log("From the server: ", json.data)

      setFavoriteChannels(prevState => [...prevState, json.data])

      await setChannel(value)

      event.target.elements.name.value = ""
    }
  }

  const fetchChannels = async () => {

    try {
      setIsLoading(true)
      const path = `https://${window.location.hostname}`

      const response = await fetch(`${path}/api/database`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'GET_CHANNELS',
          key: 'CHANNELS'
        })
      })

      if (response.status === 404) {
        console.warn('Channel key not be found')
        setIsLoading(false)
        return
      }


      const json = await response.json()
      const channelData = []

      if (json) {
        const channelNames = json.data.split(",")
      
        console.log('CHANNEL NAMES: ', channelNames)


        for await (const channelName of channelNames) {
          console.log("Getting twitch data for: ", channelName)
          const channelResp = await fetch(`${path}/api/twitch`, {
            method: 'POST',
            headers:{
              'Content-Type': 'application/json'

            },
            body: JSON.stringify({
              data: channelName
            })
          })

          const json = await channelResp.json()

          if (json.data){
            channelData.push(json.data)
            console.log(channelData)
          }
        }
      }

      // Set State 
      setFavoriteChannels(channelData)
      setIsLoading(false)
    } catch (error) {
      console.warn(error.message)
      setIsLoading(false)
    }
  }

  const setChannel = async channelName => {
    try {
      // get all the current streamers names in the list
      const currentStreamers = favoriteChannels.map(channel => channel.display_name.toLowerCase())

      const streamerList = [...currentStreamers, channelName].join(",")

      const path = `https://${window.location.hostname}`

      const response = await fetch(`${path}/api/database`, {
        method: 'POST',
        body: JSON.stringify({
          key: 'CHANNELS',
          value: streamerList
        })
      })
      if (response.status === 200) {
        console.log(`Set ${channelName} in DB.`)

      }
    } catch (error) {
      console.warn(error.message)
    }
  }

  //Render Method
  const renderForm = () => (
    <div className={styles.formContainer}>
      <form onSubmit={addStreamChannel}>
        <input id="name" placeholder="圖奇频道" type="text" required />
        <button type="submit">添加 直播者</button>
      </form>
    </div>
  )

  //UseEffects
  useEffect(() => {
    console.log('CHECKING DB...')
    fetchChannels()
  }, [])

 

  return (
    <div className={styles.container}>
      <Head>
        <title>_个性圖奇仪表盘</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className={styles.inputContainer}>
        <h1>欢迎来到个性圖奇仪表盘! 🎉</h1>
        {renderForm()}
        {isLoading && <div className={styles.loadingIndicator}>
        <p> Loading Streamers...</p>
        </div>
        }
        {!isLoading && <StreamerGrid channels={favoriteChannels} setChannel={setFavoriteChannels} />}
      </div>
    </div>
  )
}

export default Home