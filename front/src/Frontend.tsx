import { Outlet } from "react-router-dom";

const Frontend = () => {
    return (
        <>
            <main
                style={{
                    minHeight: "800px",
                    margin: 0,
                    padding: 0,
                    width: "100%",
                }}
            >
                <Outlet />
            </main>
        </>
    );
};

export default Frontend;
