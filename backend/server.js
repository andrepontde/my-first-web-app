const express = require("express");
const path = require("path");
const fs = require("fs");
const igdbapi = require("./igdbapi");

const app = express();

//Send games by a specified platform to the front end JS
app.get('/gamesByPlatform/:id', async (req, res) => {
    try {
        const platformID = req.params.id; //Get the platform ID from the query
        const gamesByPlatform = await igdbapi.gameByPlatform(platformID);
        res.json(gamesByPlatform); //Return the filtered games
    } catch (error) {
        console.log("Error fetching GAMES BY PLATFORM" + error);
        return res.send({status: "Unable to fetch games by platform"});    
    }
});

//Send games by a specified name to the front end JS
app.get('/searchGame', async (req, res) => {
    try {
        const gameName = req.query.search; //Get the search term from the query parameter
        const searchedGame = await igdbapi.searchGame(gameName); 
        res.json(searchedGame); //Return the searched game
    } catch (error) {
        console.error('Error searching for game:', error);
        res.status(500).json({ error: 'Failed to search for game' });
    }
});

app.use(express.json());

//Class code - Add an item to a JSON file
app.post('/wishlist', (req, res) => {
    const newGame = req.body; //The game data received from the frontend
    const wishlistPath = path.join(__dirname, 'wishlist.json');

    fs.readFile(wishlistPath, 'utf-8', (error, data) => {
        if (error) {
            console.log('Error reading wishlist:' + error);
            return res.send({status: "Failed to read wishlist"}); 
        }
        let wishlist = [];
        //If data exists, parse it into an array
        if (data) {
            wishlist = JSON.parse(data);
        }

        newGame.rank = wishlist.length + 1; 

        //Add the new game to the wishlist array
        wishlist.push(newGame);
        //Write the updated wishlist back to the file
        fs.writeFile(wishlistPath, JSON.stringify(wishlist, null, 2), (err) => {
            if (error) {
                console.log('Error saving wishlist:' + error);
                return res.send({status: "Game was not added!"});
            }
            res.status(201).json({ message: 'Game added to wishlist' });
        });
    });
});
//Class code - Send the JSON file data to the front end JS
app.get('/wishlist', (req, res) => {
    const wishlistPath = path.join(__dirname, 'wishlist.json');
    //Read the wishlist JSON file
    fs.readFile(wishlistPath, 'utf-8', (error, data) => {
        if (error) {
            console.log('Error reading wishlist:', + error);
            return res.send({status: "wishlist Error"}); 
        }
        //Send the wishlist data as JSON
        res.json(JSON.parse(data));
    });
});
//Class code inspiration - Delete game from file.
app.delete('/wishlist/:id', (req, res) => {
    const gameId = parseInt(req.params.id, 10); //Convert the ID to a number
    const wishlistPath = path.join(__dirname, 'wishlist.json');
    fs.readFile(wishlistPath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading wishlist:', err);
            return res.status(500).json({ error: 'Failed to read wishlist' });
        }
        let wishlist = JSON.parse(data);
        
        //Filter out the game with the specified ID
        const updatedWishlist = wishlist.filter((game) => game.id !== gameId);

        //Update the rank again
        let deletedRank = null;
        for (let x = 0; x < wishlist.length; x++) {
            if (wishlist[x].id === gameId) {
                deletedRank = wishlist[x].rank;
                break;
            }
        }   

        for (let i = 0; i < updatedWishlist.length; i++) {
            const game = updatedWishlist[i];
            if (game.rank > deletedRank) {
                game.rank -= 1;
            }
        }

        fs.writeFile(wishlistPath, JSON.stringify(updatedWishlist, null, 2), (err) => {
            if (err) {
                console.error('Error saving updated wishlist:', err);
                return res.status(500).json({ error: 'Failed to save updated wishlist' });
            }
            res.status(200).json({ message: 'Game removed from wishlist' });
        });
    });
});
//Class code - Update an Item
app.put('/wishlist/:id', (req, res) => {
    const gameId = parseInt(req.params.id, 10);
    const updatedGame = req.body;
    const wishlistPath = path.join(__dirname, 'wishlist.json');
  
    fs.readFile(wishlistPath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading wishlist:', err);
        return res.status(500).json({ error: 'Failed to read wishlist' });
      }
  
      let wishlist = JSON.parse(data);
  
      //Find the original game in the wishlist
      const originalGameIndex = wishlist.findIndex(game => game.id === gameId);
      const originalRank = wishlist[originalGameIndex].rank;
  
      //Update the game
      wishlist[originalGameIndex] = updatedGame;
  
      //Handle rank shifting
      if (originalRank !== updatedGame.rank) {
        for (let i = 0; i < wishlist.length; i++) {
            const game = wishlist[i];
          
            if (game.id !== updatedGame.id) {
              if (game.rank >= updatedGame.rank && game.rank < originalRank) {
                game.rank += 1; //Push down if within new rank range
              } else if (game.rank <= updatedGame.rank && game.rank > originalRank) {
                game.rank -= 1; //Pull up if in previous rank range
              }
            }
          }
      }

      //Sort by rank before saving - code understood from https://www.geeksforgeeks.org/how-to-sort-json-array-in-javascript-by-value/
      wishlist.sort((a, b) => a.rank - b.rank);
  
      fs.writeFile(wishlistPath, JSON.stringify(wishlist, null, 2), err => {
        if (err) {
          console.error('Error saving updated wishlist:', err);
          return res.status(500).json({ error: 'Failed to save updated wishlist' });
        }
        res.status(200).json({ message: 'Game updated and ranks adjusted' });
      });
    });
});







app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

//Serve each file individually
app.get("/about", (req, res) => {
    console.log("About page accessed");
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'about.html'));
});
app.get("/home", (req, res) => {
    console.log("Main page accessed");
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});
app.get("/contact", (req, res) => {
    console.log("Contact page accessed");
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'contact.html'));
});
app.get("/service", (req, res) => {
    console.log("Service page accessed");
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'service.html'));
});
app.get("/wishlistPage", (req, res) => {
    console.log("wishlist page accessed");
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'wishlist.html'));
});
app.get("/create", (req, res) => {
    console.log("wishlist page accessed");
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'create.html'));
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', '404.html'));
});
   

app.get("/", (req, res) => {
    console.log("404!!!")
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

//Start the server and fetch IGDB data
const port = 3000;
app.listen(port, async () => {
    console.log(`http://localhost:${port}/`);
    await igdbapi.getAccessToken();
});
