import React from "react";

/**
 * props:
 *      - setConfig
 */
class ConfigView extends React.Component {
    constructor(props) {
        this.state = {
            name: ""
        };
    }

    handleSubmit(event) {
        event.preventDefault();

        this.props.setConfig({
            humanPlayerName: this.state.name
        });
    }

    handleInputChange(event) {
        this.setState({
            name: event.target.value
        });
    }

    render() {
        return (
            <main>
                <form onSubmit={ this.handleSubmit }>
                    <input type="text" class="form-control" name="name" placeholder="please enter a name" required="true"
                        onChange={ this.handleInputChange }/>
                    <button class="btn btn-success form-control" type="submit">Play!</button>
                </form>
            </main>
        );
    }
}