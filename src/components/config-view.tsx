import React, {Component, SyntheticEvent} from "react";


interface IConfigViewProps {
    setConfig: any;
}


interface IConfigViewState {
    name: string;
}


class ConfigView extends Component<IConfigViewProps, IConfigViewState> {
    constructor(props: IConfigViewProps) {
        super(props);

        this.state = {
            name: ""
        };
    }

    handleSubmit(event: React.SyntheticEvent) {
        event.preventDefault();

        this.props.setConfig({
            humanPlayerName: this.state.name
        });
    }

    handleInputChange(event: SyntheticEvent) {
        this.setState({
            name: (event.target as HTMLInputElement).value
        });
    }

    render() {
        return (
            <main>
                <form onSubmit={ this.handleSubmit }>
                    <input type="text" className="form-control" name="name" placeholder="please enter a name" required={true}
                        onChange={ this.handleInputChange }/>
                    <button className="btn btn-success form-control" type="submit">Play!</button>
                </form>
            </main>
        );
    }
}