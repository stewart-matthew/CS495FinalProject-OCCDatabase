export default function About() {
    const sections = [
        {
            key: "home",
            title: "Home",
            description: (
                <>
                    Navigate to the Home page for a list of churches in the West Alabama area
                    participating in Operation Christmas Child.
                    <br /><br />
                    Clicking on one of the <strong>'Church Information'</strong> buttons will display
                    the location information of the church, its shoebox count, and a list of the
                    individuals at the church involved in OCC.
                    <br /><br />
                    The filters at the top of the page allow you to narrow your search results by typing
                    in your desired church name, area code, or shoebox count.
                    <br /><br />
                    If you click on one of the four county buttons, you will see results for churches
                    only in the selected county.
                </>
            ),
        },
        {
            key: "profile",
            title: "Profile",
            description: (
                <>
                    The Profile page displays your name, contact information, and the role associated
                    with your account.
                    <br /><br />
                    If you wish to sign out of your account, there is a <strong>'logout'</strong> button
                    below the contact information section.
                </>
            ),
        },
        {
            key: "team",
            title: "Team Members",
            description: (
                <>
                    The Team Members page contains a list of all individuals working with Operation
                    Christmas Child West Alabama and their contact information.
                    <br /><br />
                    Click on <strong>'More Information'</strong> to view a member's church affiliation,
                    county, and any alternate contact information.
                </>
            ),
        },
    ];

    return (
        <div className="max-w-5xl mx-auto mt-12 px-6">
            <h1 className="text-4xl font-bold mb-10">About</h1>
            
            <div className="grid md:grid-cols-2 gap-6 auto-rows-min">
               
                <div className="bg-white p-6 rounded-2xl shadow-sm row-span-2">
                    <h2 className="text-xl font-semibold mb-3">{sections[0].title}</h2>
                    <p className="text-gray-700 leading-relaxed">{sections[0].description}</p>
                </div>

                
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-semibold mb-3">{sections[1].title}</h2>
                    <p className="text-gray-700 leading-relaxed">{sections[1].description}</p>
                </div>

                
                <div className="bg-white p-6 rounded-2xl shadow-sm transition">
                    <h2 className="text-xl font-semibold mb-3">{sections[2].title}</h2>
                    <p className="text-gray-700 leading-relaxed">{sections[2].description}</p>
                </div>
            </div>
        </div>
    );
}
