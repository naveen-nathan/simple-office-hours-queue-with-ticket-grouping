import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { TicketStatus, UserRole } from "@prisma/client";
import { Select, SingleValue } from "chakra-react-select";
import Head from "next/head";
import { RefObject, useEffect, useState } from "react";
import { TicketWithNames } from "../../server/trpc/router/ticket";
import { SITE_BASE_TITLE } from "../../utils/constants";
import { trpc } from "../../utils/trpc";
import { uppercaseFirstLetter } from "../../utils/utils";
import HandleAllConfirmationModal from "../modals/HandleAllConfirmationModal";
import TicketCard from "./TicketCard";
import { TabType } from "./TicketQueue";

interface TicketListProps {
  tickets: TicketWithNames[];
  ticketStatus: TabType;
  userRole: UserRole;
  userId: string;
}

/**
 * TicketList component that displays the list of tickets for a given status
 */
const TicketList = (props: TicketListProps) => {
  const { tickets: initialTickets, ticketStatus, userRole, userId } = props;

  const [displayedTickets, setDisplayedTickets] =
    useState<TicketWithNames[]>(initialTickets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [filterBy, setFilterBy] = useState("-");
  const [filterByGroup, setFilterByGroup] = useState("-");
  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const closeTicketsMutation = trpc.ticket.closeTickets.useMutation();
  const [parent]: [RefObject<HTMLDivElement>, (enabled: boolean) => void] =
    useAutoAnimate();

  useEffect(() => {
    // Change displayed tickets according to current filter
    if (filterBy === "-") {
      setDisplayedTickets(initialTickets);
    } else {
      const newDisplayedTickets = initialTickets.filter(
        (ticket) =>
          ticket.assignmentName === filterBy ||
          ticket.locationName === filterBy,
      );
      setDisplayedTickets(newDisplayedTickets);
    }
  }, [initialTickets]);

  /** Set filterBy if it exists in sessionStorage */
  useEffect(() => {
    const filterByFromSessionStorage = sessionStorage.getItem("filterBy");
    handleFilterTickets({
      value: filterByFromSessionStorage ?? "-",
      label: filterByFromSessionStorage ?? "-",
      id: filterByFromSessionStorage ?? "-",
    });
  }, []);

  const assignmentList = Array.from(
    new Set(initialTickets.map((ticket) => ticket.assignmentName)),
  );
  const locationList = Array.from(
    new Set(initialTickets.map((ticket) => ticket.locationName)),
  );

  const groupList = Array.from(
      new Set(initialTickets.map((ticket) => ticket.group)),
  );

  const filterByGroupOptions = ["-", ...groupList].map(
      (option) => ({
        label: option,
        value: option,
        id: option,
      }),
  );

  const filterByOptions = ["-", ...assignmentList, ...locationList].map(
    (option) => ({
      label: option,
      value: option,
      id: option,
    }),
  );

  const handleApproveTickets = async (tickets: TicketWithNames[]) => {
    await approveTicketsMutation.mutateAsync({
      ticketIds: tickets.map((ticket) => ticket.id),
    });
  };

  const handleAssignTickets = async (tickets: TicketWithNames[]) => {
    await assignTicketsMutation.mutateAsync({
      ticketIds: tickets.map((ticket) => ticket.id),
    });
  };

  const handleResolveTickets = async (tickets: TicketWithNames[]) => {
    await resolveTicketsMutation.mutateAsync({
      ticketIds: tickets.map((ticket) => ticket.id),
    });
  };

  const handleCloseTickets = async (tickets: TicketWithNames[]) => {
    await closeTicketsMutation.mutateAsync({
      ticketIds: tickets.map((ticket) => ticket.id),
    });
  };

  const handleAllText = () => {
    switch (ticketStatus) {
      case TicketStatus.PENDING:
        return "approve all";
      case TicketStatus.OPEN:
        return "help all";
      case TicketStatus.ASSIGNED:
        return "resolve all";
      default:
        return "Error: Invalid ticket status";
    }
  };

  /** Which method is currently being used */
  const getHandleAllMethod = () => {
    switch (ticketStatus) {
      case TicketStatus.PENDING:
        return () => {
          handleApproveTickets(displayedTickets);
          setIsModalOpen(false);
        };
      case TicketStatus.OPEN:
        return () => {
          handleAssignTickets(displayedTickets);
          setIsModalOpen(false);
        };
      case TicketStatus.ASSIGNED:
        return () => {
          handleResolveTickets(displayedTickets);
          setIsModalOpen(false);
        };
      default:
        return () => {};
    }
  };

  const handleFilterTickets = (
    filterBy: SingleValue<(typeof filterByOptions)[0]>,
  ) => {

    if (filterBy?.value === "-") {
      setFilterBy("-");
      setDisplayedTickets(initialTickets);
      sessionStorage.setItem("filterBy", "-");
      return;
    }

    if (filterBy?.value === undefined) {
      setFilterBy("-");
      sessionStorage.setItem("filterBy", "-");
      return;
    }

    sessionStorage.setItem("filterBy", filterBy.value);
    setFilterBy(filterBy.value);
    // Allows filtering by assignmentName or locationName
    const newDisplayedTickets = initialTickets.filter(
      (ticket) =>
        ticket.assignmentName === filterBy.value ||
        ticket.locationName === filterBy.value,
    );

    setDisplayedTickets(newDisplayedTickets);
  };

  const handleFilterByGroup = (
      filterByGroup: SingleValue<(typeof filterByGroupOptions)[0]>,
  ) => {

    if (filterByGroup?.value === "-") {
      setFilterBy("-");
      setDisplayedTickets(initialTickets);
      sessionStorage.setItem("filterBy", "-");
      return;
    }

    if (filterByGroup?.value === undefined) {
      setFilterBy("-");
      sessionStorage.setItem("filterBy", "-");
      return;
    }

    sessionStorage.setItem("filterBy", filterByGroup.value);
    setFilterByGroup(filterByGroup.value);
    // Allows filtering by assignmentName or locationName
    const newDisplayedTickets = initialTickets.filter(
        (ticket) =>
            ticket.group === filterByGroup.value
    );

    setDisplayedTickets(newDisplayedTickets);
  };

  if (initialTickets.length === 0) {
    return <Text>No {uppercaseFirstLetter(ticketStatus)} Tickets!</Text>;
  }

  return (
    <>
      <Head>
        <title>
          {displayedTickets.length > 0 ? `(${displayedTickets.length})` : ""}{" "}
          {SITE_BASE_TITLE}
        </title>
      </Head>
      <Flex flexDir="column">
        <Flex justifyContent="end" mb={4}>

          <Box width="sm">
            <Select
              value={{ label: filterBy, value: filterBy, id: filterBy }}
              options={filterByOptions}
              placeholder="Filter by..."
              onChange={handleFilterTickets}
            />
          </Box>

          <Box width="sm">
            <Select
                value={{ label: filterByGroup, value: filterByGroup, id: filterByGroup }}
                options={filterByGroupOptions}
                placeholder="Filter by..."
                onChange={handleFilterByGroup}
            />
          </Box>

          <Button
            hidden={
              userRole !== UserRole.STAFF ||
              ticketStatus === "Priority" ||
              ticketStatus === "Public" ||
              ticketStatus === TicketStatus.ABSENT
            }
            mb={4}
            ml={4}
            alignSelf="flex-end"
            onClick={() => setIsModalOpen(true)}
          >
            {`${uppercaseFirstLetter(handleAllText())} ${
              displayedTickets.length
            } displayed`}
          </Button>
          <Button
            hidden={
              userRole !== UserRole.STAFF ||
              ticketStatus === "Priority" ||
              ticketStatus === "Public" ||
              ticketStatus === TicketStatus.ABSENT
            }
            mb={4}
            ml={4}
            alignSelf="flex-end"
            onClick={() => setIsCloseModalOpen(true)}
          >
            {`Close all test ${displayedTickets.length} displayed`}
          </Button>
        </Flex>
        <Box ref={parent}>
          {displayedTickets.map((ticket, idx) => (
            <TicketCard
              key={ticket.id}
              idx={idx}
              ticket={ticket}
              userRole={userRole}
              userId={userId}
            />
          ))}
        </Box>
        <HandleAllConfirmationModal
          isModalOpen={isCloseModalOpen}
          setIsModalOpen={setIsCloseModalOpen}
          handleConfirm={() => {
            handleCloseTickets(displayedTickets);
          }}
          handleAllText="close all"
        />
        <HandleAllConfirmationModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          handleConfirm={getHandleAllMethod()}
          handleAllText={handleAllText()}
        />
      </Flex>
    </>
  );
};

export default TicketList;
