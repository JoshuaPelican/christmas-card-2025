class App{
    constructor(){
        this.history = new HistoryManager();
        this.init();
    }

    init(){
        this.history.register('/', (data) => this.displayHome(data.params.for))
        this.history.init();

        if(isDesktop)
            document.getElementById("instructions").innerText = "drag the globe to shake it"
    }

    displayHome(forID){
        document.title = `${forID}'s Christmas Card 2025`
        document.getElementById("title").innerText = `Merry Christmas, ${forID}!`
    }
}

const app = new App();