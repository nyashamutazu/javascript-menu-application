import Search from './modules/search'
import Recipe from './modules/Recipe'
import List from './modules/list'
import Likes from './modules/likes'
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'
import {elements, renderLoader, clearLoader} from './views/base'

/** Global state
 * - Search object 
 * - Current recipe object 
 * - Shopping list object 
 * - Liked recipes
 */
const state = {}

//  Search Controller 
const controlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput() //TODO


    if (query) {
        // 2) New search object and add to state
        state.search = new Search(query)

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults()
        renderLoader(elements.searchRes)

        // 4) Search for recipes
        await state.search.getResults()

        // 5) Render results on UI
        clearLoader()
        searchView.renderResults(state.search.result)
        try {

        // 4) Search for recipes
        await state.search.getResults()

        // 5) Render results on UI
        clearLoader()
        searchView.renderResults(state.search.result)

        } catch (error) {
            alert(error)
            clearLoader()
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
})



elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if (btn){
        const goToPage = parseInt(btn.dataset.goto, 10)
        searchView.clearResults()
        searchView.renderResults(state.search.result, goToPage)
    }
})

// Recipe Controller

const controlRecipe = async () =>{
    // Get ID from URL 
    const id = window.location.hash.replace('#', '')
    console.log(id)

    if (id){
        // Prepare UI for changes 
        recipeView.clearRecipe()
        renderLoader(elements.recipe)

        // Highlight selected search item 
        if (state.search) searchView.highlightSelected(id)

        // Create new recipe object 
        state.recipe = new Recipe(id)

        try {

        // Get recipe data and parse ingredients 
        await state.recipe.getRecipe()
        // console.log(state.recipe.ingredients)
        state.recipe.parseIngredients()
        // Calculate servings and time
        state.recipe.calcTime()
        state.recipe.calcServings()

        // Render recipe 
        clearLoader()
        recipeView.renderRecipe(
            state.recipe,
            state.likes.isLiked(id))

        } catch(error){
            alert(error)
        };
    }
}

['hashchange', 'load'].forEach( event => window.addEventListener(event, controlRecipe))

/**
 * List Controller 
 */


const controlList = () => {
    // Create a new list IF there is none yet
    if (!state.list) state.list = new List()

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient)
        listView.renderItem(item)
    })
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', el => {
    const id = el.target.closest('.shopping__item').dataset.itemid

    // Handle the delete handle 
    if (el.target.matches('.shopping__delete, .shopping__delete *')){
        // Delete from state
        state.list.deleteItem(id)

        // Delete from UI
        listView.deleteItem(id)

    // Handle count update
    } else if (el.target.matches('.shopping__count-value')) {
        const val = parseFloat(el.target.value, 10)
        state.list.updateCount(id, val)
    }
})

/**
 * Like Controller 
 */

 const controlLike = () => {
     if (!state.likes) state.likes = new Likes()
     const currentID = state.recipe.id

     if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        )
        // Toggle the like button 
        likesView.toggleLikeBtn(true)

        // Add like to UI list 
        likesView.renderLike(state.recipe)

    // User Has Liked current recipe
     } else {
        // Remove like from the state
        state.likes.deleteLike(currentID)

        // Toggle the like button 
        likesView.toggleLikeBtn(false)

        // Remove like from UI list 
        likesView.deleteLike(currentID)
     }
     likesView.toggleLikeMenu(state.likes.getNumLikes())
 }

 // Restore liked recipes on page loads 
 window.addEventListener('load', () => {
    state.likes = new Likes()

    // Restore Likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes())

    // Render the exitsing likes 
    state.likes.likes.forEach(like => likesView.renderLike(like))
 })

// Handling recipebutton clicks 

elements.recipe.addEventListener('click', el =>{
    if (el.target.matches('.btn-decrease, .btn-decrease *')){
        // Button decrease
        if (state.recipe.servings > 1){
            state.recipe.updateServings('dec')  
            recipeView.updateServingsIngredients(state.recipe) 
        }
    } else if (el.target.matches('.btn-increase, .btn-increase *')){
        // Button increase
        state.recipe.updateServings('inc')
        recipeView.updateServingsIngredients(state.recipe)
    } else if (el.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        controlList()
    } else if (el.target.matches('.recipe__love, .recipe__love *')) {
        controlLike()
    }
    // console.log(state.recipe)
})
