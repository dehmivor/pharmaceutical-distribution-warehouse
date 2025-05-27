const cycleCountFormRouter = require ("./CycleCountForm")

function route(app) {
    app.use("/", cycleCountFormRouter)
}

module.exports = route