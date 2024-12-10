import { Card } from "./ui";

const TicketStatus = ({ availableTickets }) => {
  return (
    <Card className="p-4 bg-gray-50">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Current Availability</h3>
        <p className="text-3xl font-bold text-blue-600">{availableTickets}</p>
        <p className="text-sm text-gray-600">Available Tickets</p>
      </div>
    </Card>
  );
};

export default TicketStatus;
