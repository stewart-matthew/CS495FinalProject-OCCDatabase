export default function About() {
  return (
    <div className="max-w-3xl mx-auto mt-10">
          <h1 className="text-3xl font-bold mb-4">About</h1>
          <br/>
          <h2 className= "text-1xl font-bold">Home</h2>
          <p style={{ marginBottom: '1em' }} className="text-gray-700">
              Navigate to the Home page for a list of churches in the West Alabama area participating in Operation Christmas Child.
              <br /><span className="block h-2"></span>
              Clicking on one of the "Church Information" buttons will display the location information of the church, its shoebox count, and a list of the individuals at the church involved in OCC.
              <br /><span className="block h-2"></span>
              The filters at the top of the page will allow you to narrow your search results by typing in your desired church name, area code, or shoebox count.
              <br /><span className="block h-2"></span>
              If you click on one of the four county buttons, you will see results for churches only in the selected county.
              
          </p>
          <br />
          <h2 className= "text-1xl font-bold">Profile</h2>
          <p style={{ marginBottom: '1em' }} className="text-gray-700">
              The Profile page will display your name and the contact information and role associated with your account.
              <br /><span className="block h-2"></span>
              If you wish to sign out of your account, there is a logout button below the contact information section.
        </p>
    </div>
  );
}
