import React, { useState, useEffect } from "react";
import EditableEvent from "./EditableEvent";
import { eventFilter, groupEventsByDay, weekdays_NO } from "./utils";
import { Loader, Button, Radio } from "semantic-ui-react";
import CreateNewEvent from "./CreateNewEvent";
import Modal from "react-modal";
import "./eventManager.scss";

Modal.setAppElement("#root");
Modal.defaultStyles.overlay.backgroundColor = "rgba(0,0,0,0.50)";

const AddEventButton = ({ handleClick }) => {
  return (
    <div className="add-event-button" onClick={handleClick}>
      <p>+</p>
    </div>
  );
};

const EventManager = ({ user, events = [], addressSuggestions, firestore }) => {
  const [groups, setGroups] = useState(undefined);
  const [createNew, setCreateNew] = useState(false);
  const [editEvent, setEditEvent] = useState(undefined);
  const [eventToBeDeleted, setEventToBeDeleted] = useState(undefined);
  const [showOnly, setShowOnly] = useState(undefined);
  const [filter, setFilter] = useState(false);

  useEffect(() => {
    firestore.fetchGroupsThatUserAdministrates(user.uid, setGroups);
  }, [firestore, user.uid]);

  const filteredEvents = !groups
    ? []
    : events.filter(
        (e) =>
          (!showOnly || e.groups.indexOf(showOnly) >= 0) &&
          eventFilter(groups, e)
      );
  const groupedEvents = groupEventsByDay(filteredEvents);
  const logout = () => firestore.logout();

  if (createNew || editEvent) {
    return (
      <CreateNewEvent
        existingEvent={events.filter((e) => e.id === editEvent)[0]}
        editing={editEvent !== undefined}
        cancelCallback={() => {
          setCreateNew(false);
          setEditEvent(undefined);
          window.scrollTo(0, 0);
        }}
        submitCallback={(event) => {
          firestore.addEvent(event, user.uid).then(setCreateNew(false));
          window.scrollTo(0, 0);
        }}
        submitSubeventCallback={(event) => {
          firestore.addSubEvent(event, user.uid);
        }}
        deleteSubeventCallback={(event_id) => {
          firestore.removeSubEvent(event_id);
        }}
        updateCallback={(event) => {
          firestore.updateEvent(event).then(setEditEvent(undefined));
          window.scrollTo(0, 0);
        }}
        availableGroups={groups}
        addressSuggestions={addressSuggestions}
      />
    );
  }

  const deleteEvent = () => {
    firestore.removeEvent(eventToBeDeleted).catch((err) => console.log(err));
    setEventToBeDeleted(undefined);
  };

  const onKeyPress = (event) => {
    if (event.key === "Enter" && eventToBeDeleted) {
      deleteEvent();
    }
  };

  return (
    <div className="event-manager-wrapper" onKeyPress={onKeyPress}>
      <Modal
        isOpen={eventToBeDeleted !== undefined}
        className="delete-event-modal"
      >
        {eventToBeDeleted && (
          <label>
            Er du sikker på at du vil slette{" "}
            <span className="font-bold">
              {
                filteredEvents.filter((e) => e.id === eventToBeDeleted)[0]
                  .title_NO
              }
            </span>{" "}
            ?
          </label>
        )}
        <div className="full-width flex-row margin-top-large">
          <Button secondary onClick={() => setEventToBeDeleted(undefined)}>
            {" "}
            Nei, gå tilbake{" "}
          </Button>
          <Button
            primary
            onClick={() => {
              deleteEvent();
            }}
          >
            {" "}
            Ja, slett!{" "}
          </Button>
        </div>
      </Modal>

      <Loader active={!groups} />
      <div className="add-event-button-wrapper">
        <AddEventButton handleClick={() => setCreateNew(true)} />
        {filter && (
          <div className="event-filter-checkbox-wrapper margin-top-large">
            <Radio
              label="Åpent for alle"
              className="filter-group-checkbox"
              onClick={() => setShowOnly("all")}
              checked={showOnly === "all"}
            />
            {groups &&
              groups.map((g) =>
                g === "all" ? null : (
                  <Radio
                    key={g}
                    checked={showOnly === g}
                    label={`Gruppe ${g}`}
                    onClick={() => setShowOnly(g)}
                    className="filter-group-checkbox"
                  />
                )
              )}
          </div>
        )}
        {!filter && groups && groups.length > 1 && (
          <Button
            type="button"
            className="margin-top-large margin-right-auto"
            onClick={() => setFilter(true)}
          >
            {" "}
            Legg til filter{" "}
          </Button>
        )}
      </div>
      {groups &&
        events &&
        weekdays_NO.map((day) => {
          const dayEvents = groupedEvents[day].map((e) => (
            <EditableEvent
              key={e.id}
              event={e}
              canManage={e.groups.reduce(
                (acc, curr) => acc && groups.indexOf(curr) >= 0,
                true
              )}
              deleteCallback={(id) => setEventToBeDeleted(id)}
              editCallback={(id) => setEditEvent(id)}
            />
          ));
          return (
            <div key={day} className="event-group">
              <div className="event-group-day-label"> {day} </div>
              {dayEvents}
            </div>
          );
        })}
      <Button
        type="button"
        className="full-width margin-top-medium margin-bottom-large"
        primary
        onClick={logout}
      >
        {" "}
        Logg ut{" "}
      </Button>
    </div>
  );
};

export default EventManager;
