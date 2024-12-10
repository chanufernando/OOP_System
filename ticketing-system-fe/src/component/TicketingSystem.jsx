import React from "react";
import { Card, CardHeader, CardContent, CardTitle, Button } from "./ui";
import ConfigForm from "./ConfigForm";
import Notifications from "./Notifications";
import { useWebSocket } from "../hooks";
import { useTicketConfig } from "../hooks";
import TicketAvailability from "./TicketAvailability";

const TicketingSystem = () => {
  const { config, setConfig, errors, handleSubmit, error, success } =
    useTicketConfig();

  const { ticketAvailability } = useWebSocket("ws://localhost:3001");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Event Ticket Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ConfigForm
          config={config}
          onChange={handleChange}
          errors={errors}
          handleSubmit={handleSubmit}
        />
        <TicketAvailability />
        <Notifications error={error} success={success} />
      </CardContent>
    </Card>
  );
};

export default TicketingSystem;
